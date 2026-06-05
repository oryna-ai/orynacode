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
        res.end("<html><body><h1>Login successful!</h1><p>You can close this window.</p></body></html>")
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

export async function OrynaAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    provider: {
      id: "oryna",
      async models(provider, ctx) {
        try {
          const res = await fetch("https://oryna.ai/api.json", {
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) return {}
          const data = (await res.json()) as Record<string, any>
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
