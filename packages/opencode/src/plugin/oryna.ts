import { createServer } from "http"
import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import * as Log from "@opencode-ai/core/util/log"
import open from "open"

const log = Log.create({ service: "oryna-plugin" })
const ORYNA_LOGIN_URL = "https://oryna.ai/login"
const ORYNA_REFRESH_URL = "https://oryna.ai/auth/refresh"

function randomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      if (!addr || typeof addr === "string") {
        server.close()
        reject(new Error("Failed to get port"))
        return
      }
      server.close()
      resolve(addr.port)
    })
  })
}

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

function parseJwtPayload(token: string): Record<string, unknown> | undefined {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return undefined
    const payload = parts[1]
    const decoded = Buffer.from(payload, "base64url").toString("utf-8")
    return JSON.parse(decoded)
  } catch {
    return undefined
  }
}

function jwtExpired(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp || typeof payload.exp !== "number") return false
  return Date.now() > payload.exp * 1000
}

interface OAuthResult {
  resolve: (token: string) => void
  reject: (error: Error) => void
  state: string
}

let _pendingOAuth: OAuthResult | undefined
let _oauthServer: ReturnType<typeof createServer> | undefined

async function startOAuthServer(): Promise<number> {
  const port = await randomPort()

  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`)
      if (!url.pathname.startsWith("/callback")) return

      const token = url.searchParams.get("token")
      const state = url.searchParams.get("state")

      if (token && _pendingOAuth && state === _pendingOAuth.state) {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OrynaCode — Login Successful</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f8fafc;
    color: #0f1a1e;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; text-align: center;
  }
  .card {
    background: #fff;
    border: 1px solid #e0f2f5;
    border-radius: 16px;
    padding: 48px 40px;
    max-width: 400px;
    width: 90%;
  }
  .icon {
    width: 64px; height: 64px;
    background: #00c4e9;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    font-size: 32px;
    color: #fff;
  }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; color: #003340; }
  p { color: #5c7a84; font-size: 14px; line-height: 1.6; }
  .brand { margin-top: 24px; font-size: 12px; color: #94c8d4; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Login Successful</h1>
    <p>You are now signed in to OrynaCode.<br>Return to the terminal to continue.</p>
    <div class="brand">OrynaCode</div>
  </div>
</body>
</html>`)
        _pendingOAuth.resolve(token)
        return
      }

      res.writeHead(400)
      res.end("Missing token or state mismatch")
    })

    server.listen(port, "127.0.0.1", () => {
      _oauthServer = server
      resolve(port)
    })
  })
}

function stopOAuthServer() {
  if (_oauthServer) {
    _oauthServer.close()
    _oauthServer = undefined
  }
}

function waitForToken(state: string): Promise<string> {
  if (_pendingOAuth) {
    _pendingOAuth.reject(new Error("Superseded by a newer Oryna login request"))
    _pendingOAuth = undefined
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        if (_pendingOAuth) {
          _pendingOAuth = undefined
          reject(new Error("Login timeout - authorization took too long"))
        }
      },
      5 * 60 * 1000,
    )
    _pendingOAuth = {
      state,
      resolve: (token) => {
        clearTimeout(timeout)
        resolve(token)
      },
      reject: (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    }
  })
}

let _refreshPromise: Promise<string> | undefined

async function refreshJwt(oldJwt: string): Promise<string> {
  try {
    const res = await fetch(ORYNA_REFRESH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${oldJwt}` },
    })
    if (!res.ok) throw new Error(`Refresh failed: ${res.status}`)
    const data = (await res.json()) as { token?: string }
    if (!data.token) throw new Error("No token in refresh response")
    return data.token
  } catch {
    throw new Error("Failed to refresh Oryna token")
  }
}

function mapOrynaModels(data: Record<string, any>): Record<string, any> {
  const oryna = data?.oryna
  if (!oryna?.models) return {}
  const result: Record<string, any> = {}
  for (const [id, model] of Object.entries(oryna.models as Record<string, any>)) {
    result[id] = {
      id,
      name: model.name,
      family: model.family,
      api: { id, url: oryna.api ?? "https://api.oryna.ai/v1", npm: oryna.npm ?? "@ai-sdk/openai-compatible" },
      capabilities: {
        temperature: model.temperature ?? false,
        reasoning: model.reasoning ?? false,
        attachment: model.attachment ?? false,
        toolcall: model.tool_call ?? true,
        input: { text: model.modalities?.input?.includes("text") ?? true, audio: false, image: false, video: false, pdf: false },
        output: { text: model.modalities?.output?.includes("text") ?? true, audio: false, image: false, video: false, pdf: false },
        interleaved: false,
      },
      cost: {
        input: model.cost?.input ?? 0,
        output: model.cost?.output ?? 0,
        cache: { read: model.cost?.cache_read ?? 0, write: model.cost?.cache_write ?? 0 },
      },
      limit: {
        context: model.limit?.context ?? 128000,
        input: model.limit?.input,
        output: model.limit?.output ?? 16384,
      },
      status: "active" as const,
      options: {},
      headers: {},
      release_date: model.release_date ?? "2025-01-01",
      variants: {},
    }
  }
  return result
}

export async function OrynaAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    provider: {
      id: "oryna",
      name: "Oryna AI",
      async models(_provider, _ctx) {
        try {
          const res = await fetch("https://oryna.ai/api.json", {
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) return {}
          return mapOrynaModels(await res.json())
        } catch {
          return {}
        }
      },
    },
    auth: {
      provider: "oryna",
      async loader(getAuth) {
        const auth = await getAuth()
        if (auth.type !== "api") return {}

        let jwt = auth.key

        if (jwtExpired(jwt)) {
          if (!_refreshPromise) {
            _refreshPromise = refreshJwt(jwt).catch(() => {
              _refreshPromise = undefined
              return jwt
            })
          }
          jwt = await _refreshPromise
          _refreshPromise = undefined

          if (jwt !== auth.key) {
            await input.client.auth
              .set({
                path: { id: "oryna" },
                body: { type: "api", key: jwt },
              })
              .catch((err) => log.error("failed to persist refreshed token", { error: err }))
          }
        }

        return { apiKey: jwt }
      },
      methods: [
        {
          type: "oauth",
          label: "Login with Oryna AI (Browser)",
          authorize: async () => {
            try {
              const port = await startOAuthServer()
              const state = randomState()
              const redirectUri = `http://127.0.0.1:${port}/callback`
              const loginUrl = `${ORYNA_LOGIN_URL}?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

              const tokenPromise = waitForToken(state)

              await open(loginUrl)

              return {
                url: loginUrl,
                instructions: "Complete login in your browser. This window will close automatically when done.",
                method: "auto" as const,
                callback: async () => {
                  try {
                    const token = await tokenPromise
                    return {
                      type: "success" as const,
                      key: token,
                    }
                  } catch (err) {
                    log.error("oryna login callback failed", { error: err })
                    return { type: "failed" as const }
                  } finally {
                    stopOAuthServer()
                  }
                },
              }
            } catch (err) {
              log.error("oryna login authorize failed", { error: err })
              return {
                url: ORYNA_LOGIN_URL,
                instructions: "Failed to start login server. Please use API key instead.",
                method: "code" as const,
                callback: async () => ({ type: "failed" as const }),
              }
            }
          },
        },
        {
          type: "api",
          label: "API key",
        },
      ],
    },
  }
}

export async function OrynaLocalProvider(_input: PluginInput): Promise<Hooks> {
  return {
    provider: {
      id: "oryna-proxy",
      name: "Oryna Local",
      async models(_provider, _ctx) {
        const url = process.env.ORYNA_PROXY_URL
        if (!url) return {}
        try {
          const base = url.endsWith("/") ? url.slice(0, -1) : url
          const res = await fetch(`${base}/api.json`, {
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) return {}
          return mapOrynaModels(await res.json())
        } catch {
          return {}
        }
      },
    },
  }
}
