import { Effect } from "effect"
import { Catalog } from "../../catalog"
import { Config } from "../../config"
import { PluginV2 } from "../../plugin"
import { ProviderV2 } from "../../provider"

const ORYNA_ID = ProviderV2.ID.make("oryna")
const LOCAL_ID = ProviderV2.ID.make("oryna-local")

export const OrynaPlugin = PluginV2.define({
  id: PluginV2.ID.make("oryna"),
  effect: Effect.gen(function* () {
    const catalog = yield* Catalog.Service
    const config = yield* Config.Service
    const entries = yield* config.entries()

    let mode = "auto" as "cloud" | "internal" | "auto"
    let configuredProxyUrl: string | undefined

    for (const entry of entries) {
      if (entry.type !== "document") continue
      if (entry.info.mode) mode = entry.info.mode
      configuredProxyUrl = entry.info.proxy?.url
    }

    const transform = yield* catalog.transform()

    yield* transform((catalog) => {
      catalog.provider.update(ORYNA_ID, (provider) => {
        provider.name = "Oryna"
        provider.env = ["ORYNA_API_KEY"]
        provider.enabled = { via: "custom", data: {} }
        provider.api = {
          type: "aisdk",
          package: "@ai-sdk/openai-compatible",
          url: process.env.ORYNA_BASE_URL ?? "https://api.oryna.ai/v1",
        }
        if (!process.env.ORYNA_API_KEY && !provider.request.body.apiKey) {
          provider.request.body.apiKey = "public"
        }
      })

      if (mode !== "cloud" && configuredProxyUrl) {
        const base = configuredProxyUrl.endsWith("/")
          ? configuredProxyUrl.slice(0, -1)
          : configuredProxyUrl
        catalog.provider.update(LOCAL_ID, (provider) => {
          provider.name = "Oryna (Internal)"
          provider.env = []
          provider.api = {
            type: "aisdk",
            package: "@ai-sdk/openai-compatible",
            url: `${base}/v1`,
          }
          provider.enabled = { via: "custom", data: {} }
        })
      }

      const orynaIDs = new Set([ORYNA_ID, LOCAL_ID])
      for (const item of catalog.provider.list()) {
        if (orynaIDs.has(item.provider.id)) continue
        catalog.provider.update(item.provider.id, (provider) => {
          provider.enabled = false
        })
      }
    })

    return {}
  }),
})
