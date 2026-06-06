import { ProviderAuth } from "@/provider/auth"
import { Provider } from "@/provider/provider"
import type { ModelsDev } from "@opencode-ai/core/models-dev"

import { mapValues } from "remeda"
import { Effect, Schema } from "effect"
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { ProviderAuthApiError } from "../groups/provider"
import { ProviderV2 } from "@opencode-ai/core/provider"

async function loadLocalProxyModels(url: string): Promise<Record<string, any>> {
  try {
    const base = url.endsWith("/") ? url.slice(0, -1) : url
    const res = await fetch(`${base}/api.json`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) return await res.json()
  } catch {}
  return {}
}

const ORYNA_MODELS_URL = "https://oryna.ai"
const ORYNA_CACHE_TTL = 5 * 60 * 1000

let _orynaCache: { data: Record<string, any>; at: number } | undefined

async function loadOrynaModels(): Promise<Record<string, any>> {
  if (_orynaCache && Date.now() - _orynaCache.at < ORYNA_CACHE_TTL) {
    return _orynaCache.data
  }
  try {
    const res = await fetch(`${ORYNA_MODELS_URL}/api.json`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      _orynaCache = { data, at: Date.now() }
      return data
    }
  } catch {}
  return _orynaCache?.data ?? {}
}

function mapProviderAuthError<A, R>(self: Effect.Effect<A, ProviderAuth.Error, R>) {
  return self.pipe(
    Effect.mapError((error) => {
      if (error instanceof ProviderAuth.OauthMissing) {
        return new ProviderAuthApiError({ name: error._tag, data: { providerID: error.providerID } })
      }
      if (error instanceof ProviderAuth.OauthCodeMissing) {
        return new ProviderAuthApiError({ name: error._tag, data: { providerID: error.providerID } })
      }
      if (error instanceof ProviderAuth.OauthCallbackFailed) {
        return new ProviderAuthApiError({ name: error._tag, data: {} })
      }
      if (error instanceof ProviderAuth.ValidationFailed) {
        return new ProviderAuthApiError({ name: error._tag, data: { field: error.field, message: error.message } })
      }
      return new ProviderAuthApiError({ name: "BadRequest", data: {} })
    }),
  )
}

export const providerHandlers = HttpApiBuilder.group(InstanceHttpApi, "provider", (handlers) =>
  Effect.gen(function* () {
    const provider = yield* Provider.Service
    const svc = yield* ProviderAuth.Service

    const list = Effect.fn("ProviderHttpApi.list")(function* () {
      const orynaEffect = Effect.tryPromise(() => loadOrynaModels()).pipe(
        Effect.catchCause(() => Effect.succeed({} as Record<string, ModelsDev.Provider>)),
      )
      const orynaData = yield* orynaEffect
      const orynaRemote = orynaData?.["oryna"]

      const filtered: Record<string, ModelsDev.Provider> = {}
      filtered["oryna"] = {
        id: "oryna",
        name: orynaRemote?.name ?? "Oryna AI",
        env: orynaRemote?.env ?? ["ORYNA_API_KEY"],
        npm: orynaRemote?.npm,
        api: orynaRemote?.api ?? (process.env.ORYNA_BASE_URL ?? "https://api.oryna.ai/v1"),
        models: orynaRemote?.models ?? {},
      }

      const proxyUrl = process.env.ORYNA_PROXY_URL
      const localModelsEffect = Effect.tryPromise(() =>
        proxyUrl ? loadLocalProxyModels(proxyUrl) : Promise.resolve({} as Record<string, any>),
      ).pipe(Effect.catchCause(() => Effect.succeed({} as Record<string, any>)))
      const localModels = yield* localModelsEffect
      const localRemote = localModels?.["oryna"]

      filtered["oryna-proxy"] = {
        id: "oryna-proxy",
        name: "Oryna Local",
        env: [],
        api: localRemote?.api ?? (proxyUrl ? `${proxyUrl.endsWith("/") ? proxyUrl.slice(0, -1) : proxyUrl}/v1` : ""),
        models: localRemote?.models ?? {},
      }

      const connected = yield* provider.list()
      const orynaIDs = new Set(["oryna", "oryna-proxy"])
      const filteredConnected: Record<string, any> = {}
      for (const [id, info] of Object.entries(connected)) {
        if (orynaIDs.has(id)) filteredConnected[id] = info
      }
      const providers = Object.assign(
        mapValues(filtered, (item) => Provider.fromModelsDevProvider(item)),
        filteredConnected,
      )

      const withModels = Object.fromEntries(
        Object.entries(providers).filter(([, p]) => p && Object.keys(p.models).length > 0),
      )

      return {
        all: Object.values(providers).map(Provider.toPublicInfo),
        default: Provider.defaultModelIDs(withModels),
        connected: Object.keys(filteredConnected),
      }
    })

    const auth = Effect.fn("ProviderHttpApi.auth")(function* () {
      return yield* svc.methods()
    })

    const authorize = Effect.fn("ProviderHttpApi.authorize")(function* (ctx: {
      params: { providerID: ProviderV2.ID }
      payload: ProviderAuth.AuthorizeInput
    }) {
      return yield* mapProviderAuthError(
        svc.authorize({
          providerID: ctx.params.providerID,
          method: ctx.payload.method,
          inputs: ctx.payload.inputs,
        }),
      )
    })

    const authorizeRaw = Effect.fn("ProviderHttpApi.authorizeRaw")(function* (ctx: {
      params: { providerID: ProviderV2.ID }
      request: HttpServerRequest.HttpServerRequest
    }) {
      const body = yield* Effect.orDie(ctx.request.text)
      const payload = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(ProviderAuth.AuthorizeInput))(body).pipe(
        Effect.mapError(() => new ProviderAuthApiError({ name: "BadRequest", data: {} })),
      )
      // Match legacy route behavior: when authorize() resolves without a
      // result (e.g. no further redirect), serialize as JSON `null` instead
      // of an empty body so clients can `.json()` parse the response.
      const result = yield* authorize({ params: ctx.params, payload })
      return HttpServerResponse.jsonUnsafe(result ?? null)
    })

    const callback = Effect.fn("ProviderHttpApi.callback")(function* (ctx: {
      params: { providerID: ProviderV2.ID }
      payload: ProviderAuth.CallbackInput
    }) {
      yield* mapProviderAuthError(
        svc.callback({
          providerID: ctx.params.providerID,
          method: ctx.payload.method,
          code: ctx.payload.code,
        }),
      )
      return true
    })

    return handlers
      .handle("list", list)
      .handle("auth", auth)
      .handleRaw("authorize", authorizeRaw)
      .handle("callback", callback)
  }),
)
