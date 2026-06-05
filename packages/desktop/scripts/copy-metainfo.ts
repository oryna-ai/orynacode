import { resolveChannel } from "./utils"

const arg = process.argv[2]
const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel()

const appId = channel === "prod" ? "ai.oryna.orynacode" : `ai.oryna.orynacode.${channel}`
const productName = channel === "prod" ? "OrynaCode" : `OrynaCode ${channel.charAt(0).toUpperCase() + channel.slice(1)}`
const summary = `AI coding agent powered by Oryna${channel !== "prod" ? ` (${channel})` : ""}`

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${appId}</id>

  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>

  <name>${productName}</name>
  <summary>${summary}</summary>

  <developer id="ai.oryna">
    <name>Oryna</name>
  </developer>

  <description>
    <p>
      OrynaCode is an AI coding agent that helps you write and run code with Oryna AI models.
    </p>

  <launchable type="desktop-id">${appId}.desktop</launchable>

  <content_rating type="oars-1.1" />

  <url type="bugtracker">https://github.com/oryna/orynacode/issues</url>
  <url type="homepage">https://oryna.ai</url>
  <url type="vcs-browser">https://github.com/oryna/orynacode</url>

  <screenshots>
    <screenshot type="default">
      <image>https://oryna.ai/screenshot.png</image>
    </screenshot>
  </screenshots>
</component>
`

await Bun.write(`resources/${appId}.metainfo.xml`, xml)
console.log(`Generated metainfo for ${channel} at resources/${appId}.metainfo.xml`)
