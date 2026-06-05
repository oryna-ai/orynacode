import { Config } from "@/config/config"
import { Provider } from "@/provider/provider"
import type { ModelsDev } from "@opencode-ai/core/models-dev"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

const ORYNA_MODELS_URL = "https://oryna.ai"
const ORYNA_CACHE_TTL = 5 * 60 * 1000
let _orynaCache: { data: Record<string, any>; at: number } | undefined

async function loadOrynaModels(): Promise<Record<string, any>> {
  if (_orynaCache && Date.now() - _orynaCache.at < ORYNA_CACHE_TTL) {
    return _orynaCache.data
  }
  try {
    const res = await fetch(`${ORYNA_MODELS_URL}/api.json`, { signal: AbortSignal.timeout(10000) })
    if (res.ok) {
      const data = await res.json()
      _orynaCache = { data, at: Date.now() }
      return data
    }
  } catch {}
  return _orynaCache?.data ?? {}
}

export const configHandlers = HttpApiBuilder.group(InstanceHttpApi, "config", (handlers) =>
  Effect.gen(function* () {
    const providerSvc = yield* Provider.Service
    const configSvc = yield* Config.Service

    const get = Effect.fn("ConfigHttpApi.get")(function* () {
      return yield* configSvc.get()
    })

    const update = Effect.fn("ConfigHttpApi.update")(function* (ctx) {
      yield* configSvc.update(ctx.payload)
      yield* markInstanceForDisposal(yield* InstanceState.context)
      return ctx.payload
    })

    const providers = Effect.fn("ConfigHttpApi.providers")(function* () {
      const orynaData = yield* Effect.tryPromise(() => loadOrynaModels()).pipe(
        Effect.catchCause(() => Effect.succeed({} as Record<string, ModelsDev.Provider>)),
      )
      const orynaRemote = orynaData?.["oryna"]

      const filtered: Record<string, any> = {}
      filtered["oryna"] = Provider.fromModelsDevProvider({
        id: "oryna",
        name: orynaRemote?.name ?? "Oryna AI",
        env: orynaRemote?.env ?? ["ORYNA_API_KEY"],
        npm: orynaRemote?.npm,
        api: orynaRemote?.api ?? (process.env.ORYNA_BASE_URL ?? "https://api.oryna.ai/v1"),
        models: orynaRemote?.models ?? {},
      })

      const proxyUrl = process.env.ORYNA_PROXY_URL
      if (proxyUrl) {
        const base = proxyUrl.endsWith("/") ? proxyUrl.slice(0, -1) : proxyUrl
        filtered["oryna-proxy"] = Provider.fromModelsDevProvider({
          id: "oryna-proxy",
          name: "Oryna Router",
          env: [],
          api: `${base}/v1`,
          models: {},
        })
      }

      const withModels = Object.fromEntries(
        Object.entries(filtered).filter(([, p]) => p && Object.keys(p.models).length > 0),
      )

      return {
        providers: Object.values(filtered).map(Provider.toPublicInfo),
        default: Provider.defaultModelIDs(withModels),
      }
    })

    return handlers.handle("get", get).handle("update", update).handle("providers", providers)
  }),
)
