import { Prompt, type PromptRef } from "../component/prompt"
import { createEffect, createMemo, createSignal, onMount, Show } from "solid-js"
import { Logo } from "../component/logo"
import { useTheme } from "../context/theme"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "../context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { usePluginRuntime } from "../plugin/runtime"
import { useEditorContext } from "../context/editor"
import { useTerminalDimensions } from "@opentui/solid"
import { useTuiConfig } from "../config"
import { HomeSessionDestinationProvider } from "./home/session-destination"
import { agentStatus } from "../context/agent"
import { start as startAgent, setMessageHandler, stop as stopAgent } from "orynacode-ai/oryna/agent"
import { useSDK } from "../context/sdk"
import { useRoute } from "../context/route"

let once = false
const placeholder = {
  normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
  shell: ["ls -la", "git status", "pwd"],
}

export function Home() {
  const pluginRuntime = usePluginRuntime()
  const sync = useSync()
  const route = useRouteData("home")
  const { theme } = useTheme()
  const { navigate } = useRoute()
  const sdk = useSDK()
  const promptRef = usePromptRef()
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  const editor = useEditorContext()
  const dimensions = useTerminalDimensions()
  const tuiConfig = useTuiConfig()
  const promptMaxWidth = createMemo(() => {
    const configured = tuiConfig.prompt?.max_width
    if (configured === "auto") return Math.max(75, Math.floor(dimensions().width * 0.7))
    return configured ?? 75
  })
  let sent = false

  onMount(() => {
    editor.clearSelection()
    setMessageHandler(async (content: string, from: string) => {
      let sessionID = process.env.ORYNA_GATE_AGENT_SESSION_ID
      if (!sessionID) {
        const created = await sdk.client.session.create({})
        sessionID = created.data!.id
        process.env.ORYNA_GATE_AGENT_SESSION_ID = sessionID
        navigate({ type: "session", sessionID })
      }
      const model = local.model.current()
      await sdk.client.session.prompt({
        sessionID,
        system: "*** You are responding to a collaboration message. After completing the task, you MUST use the 'reply' tool to send results back. Never output a plain text response to a collaboration message. ***",
        parts: [{
          type: "text",
          text: `[Collaboration from ${from}]\n${content}`,
        }],
        ...(model ? { model: { providerID: model.providerID, modelID: model.modelID } } : {}),
      })
    })
  })

  let lastWasOrynaGate = false
  createEffect(() => {
    const model = local.model.current()
    const isOrynaGate = model?.providerID === "orynagate"
    if (isOrynaGate && !lastWasOrynaGate) {
      startAgent()
    } else if (!isOrynaGate && lastWasOrynaGate) {
      stopAgent()
    }
    lastWasOrynaGate = isOrynaGate
  })

  const bind = (r: PromptRef | undefined) => {
    setRef(r)
    promptRef.set(r)
    if (once || !r) return
    if (route.prompt) {
      r.set(route.prompt)
      once = true
      return
    }
    if (!args.prompt) return
    r.set({ input: args.prompt, parts: [] })
    once = true
  }

  // Wait for sync and model store to be ready before auto-submitting --prompt
  createEffect(() => {
    const r = ref()
    if (sent) return
    if (!r) return
    if (!sync.ready || !local.model.ready) return
    if (!args.prompt) return
    if (r.current.input !== args.prompt) return
    sent = true
    r.submit()
  })

  return (
    <HomeSessionDestinationProvider>
      <box flexGrow={1} alignItems="center" paddingLeft={2} paddingRight={2}>
        <box flexGrow={1} minHeight={0} />
        <box height={4} minHeight={0} flexShrink={1} />
        <box flexShrink={0}>
          <pluginRuntime.Slot name="home_logo" mode="replace">
            <Logo />
          </pluginRuntime.Slot>
        </box>
        <box height={1} minHeight={0} flexShrink={1} />
        <box width="100%" maxWidth={promptMaxWidth()} zIndex={1000} paddingTop={1} flexShrink={0}>
          <pluginRuntime.Slot name="home_prompt" mode="replace" ref={bind}>
            <Prompt ref={bind} right={
              <>
                <Show when={agentStatus().connected}>
                  <text fg={agentStatus().processing ? theme.warning : theme.success}>
                    {agentStatus().processing ? "◇" : "●"}{" "}
                  </text>
                  <text fg={theme.textMuted}>
                    {agentStatus().processing ? "processing..." : `Collab · ${agentStatus().url}`}
                  </text>
                </Show>
                <pluginRuntime.Slot name="home_prompt_right" />
              </>
            } placeholders={placeholder} />
          </pluginRuntime.Slot>
        </box>
        <pluginRuntime.Slot name="home_bottom" />
        <box flexGrow={1} minHeight={0} />
        <Toast />
      </box>
      <box width="100%" flexShrink={0}>
        <pluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </HomeSessionDestinationProvider>
  )
}
