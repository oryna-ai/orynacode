import { Config } from "@/config/config"
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Global } from "@opencode-ai/core/global"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"
import path from "path"

let _localUrlTried = false

async function tryRecoverLocalUrl(): Promise<string | undefined> {
  if (_localUrlTried) return
  _localUrlTried = true
  try {
    const authFile = path.join(Global.Path.data, "auth.json")
    const data = await Bun.file(authFile).json()
    const localAuth = data?.["oryna-local"]
    if (!localAuth || localAuth.type !== "api" || !localAuth.metadata?.url) return
    const url = localAuth.metadata.url
    const base = url.endsWith("/") ? url.slice(0, -1) : url
    const res = await fetch(`${base}/api.json`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      process.env.ORYNA_LOCAL_URL = url
      return url
    }
  } catch {}
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
      providerID: "oryna-local",
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

async function fetchProxyData(url: string): Promise<{ api?: string; models: Record<string, any> }> {
  const base = url.endsWith("/") ? url.slice(0, -1) : url
  const res = await fetch(`${base}/api.json`, {
    signal: AbortSignal.timeout(10000),
  })
  if (res.ok) {
    const data = await res.json()
    const oryna = data?.oryna
    return { api: oryna?.api, models: mapOrynaModels(data) }
  }
  return { models: {} }
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
      const orynaIDs = new Set(["oryna", "oryna-local"])
      const filtered: Record<string, any> = {}
      for (const [id, info] of Object.entries(allProviders)) {
        if (orynaIDs.has(id)) filtered[id] = info
      }

      const localUrl = process.env.ORYNA_LOCAL_URL ?? (yield* Effect.tryPromise(() => tryRecoverLocalUrl()).pipe(
        Effect.catchCause(() => Effect.succeed(undefined)),
      ))
      if (localUrl) {
        const raw = yield* Effect.tryPromise(() => fetchProxyData(localUrl)).pipe(
          Effect.catchCause(() => Effect.succeed({ api: undefined, models: {} })),
        )
        const models = (raw as any).models ?? {}
        const localApi = (raw as any).api
        const existing = allProviders["oryna-local" as any] as Record<string, any> | undefined
        const entry = {
          id: "oryna-local",
          name: "Oryna Local",
          env: [],
          source: existing?.source ?? "api",
          key: existing?.key,
          api: localApi ? { url: localApi } : existing?.api,
          models,
          options: existing?.options ?? {},
        }
        filtered["oryna-local"] = entry
        allProviders["oryna-local" as any] = Provider.toPublicInfo(entry as any)
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
