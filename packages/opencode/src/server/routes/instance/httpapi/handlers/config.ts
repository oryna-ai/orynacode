import { Config } from "@/config/config"
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

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
