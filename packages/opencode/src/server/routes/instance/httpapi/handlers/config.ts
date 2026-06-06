import { Config } from "@/config/config"
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

async function fetchProxyModels(): Promise<Record<string, any>> {
  const url = process.env.ORYNA_PROXY_URL
  if (!url) return {}
  try {
    const base = url.endsWith("/") ? url.slice(0, -1) : url
    const res = await fetch(`${base}/api.json`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      return mapOrynaModels(data)
    }
  } catch {}
  return {}
}

function mapOrynaModels(data: Record<string, any>): Record<string, any> {
  const oryna = data?.oryna
  if (!oryna?.models) return {}
  const result: Record<string, any> = {}
  for (const [id, model] of Object.entries(oryna.models as Record<string, any>)) {
    const m = model as Record<string, any>
    result[id] = {
      id,
      name: m.name,
      family: m.family,
      api: { id, url: oryna.api ?? "", npm: oryna.npm ?? "@ai-sdk/openai-compatible" },
      capabilities: {
        temperature: m.temperature ?? false,
        reasoning: m.reasoning ?? false,
        attachment: m.attachment ?? false,
        toolcall: m.tool_call ?? true,
        input: { text: m.modalities?.input?.includes("text") ?? true, audio: false, image: false, video: false, pdf: false },
        output: { text: m.modalities?.output?.includes("text") ?? true, audio: false, image: false, video: false, pdf: false },
        interleaved: false,
      },
      cost: {
        input: m.cost?.input ?? 0,
        output: m.cost?.output ?? 0,
        cache: { read: m.cost?.cache_read ?? 0, write: m.cost?.cache_write ?? 0 },
      },
      limit: {
        context: m.limit?.context ?? 128000,
        input: m.limit?.input,
        output: m.limit?.output ?? 16384,
      },
      status: "active" as const,
      options: {},
      headers: {},
      release_date: m.release_date ?? "",
      variants: {},
    }
  }
  return result
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
      const allProviders = yield* providerSvc.list()
      const orynaIDs = new Set(["oryna", "oryna-proxy"])
      const filtered: Record<string, any> = {}
      for (const [id, info] of Object.entries(allProviders)) {
        if (orynaIDs.has(id)) filtered[id] = info
      }

      // fill in oryna-proxy models from local proxy when connected
      if (process.env.ORYNA_PROXY_URL && (!filtered["oryna-proxy"] || Object.keys(filtered["oryna-proxy"].models ?? {}).length === 0)) {
        const models = yield* Effect.tryPromise(() => fetchProxyModels()).pipe(
          Effect.catchCause(() => Effect.succeed({})),
        )
        if (Object.keys(models).length > 0) {
          const existing = filtered["oryna-proxy"] ?? { id: "oryna-proxy", name: "Oryna Local" }
          filtered["oryna-proxy"] = { ...existing, models }
        }
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
