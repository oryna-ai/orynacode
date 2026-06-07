import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createEffect, createMemo, createSignal, onMount, Show } from "solid-js"
import { Logo } from "../component/logo"
import { useTheme } from "../context/theme"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { TuiPluginRuntime } from "@/cli/cmd/tui/plugin/runtime"
import { useEditorContext } from "@tui/context/editor"
import { useTerminalDimensions } from "@opentui/solid"
import { useTuiConfig } from "../context/tui-config"
import { HomeSessionDestinationProvider } from "./home/session-destination"
import { agentStatus } from "../context/agent"
import { start as startAgent, setMessageHandler, stop as stopAgent } from "@/oryna/agent"
import { useSDK } from "@tui/context/sdk"
import { useRoute } from "@tui/context/route"

let once = false
const placeholder = {
  normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
  shell: ["ls -la", "git status", "pwd"],
}

export function Home() {
  const sync = useSync()
  const route = useRouteData("home")
  const { theme } = useTheme()
  const promptRef = usePromptRef()
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  const editor = useEditorContext()
  const dimensions = useTerminalDimensions()
  const tuiConfig = useTuiConfig()
  const sdk = useSDK()
  const { navigate } = useRoute()
  const promptMaxWidth = createMemo(() => {
    const configured = tuiConfig.prompt?.max_width
    if (configured === "auto") return Math.max(75, Math.floor(dimensions().width * 0.7))
    return configured ?? 75
  })
  let sent = false

  onMount(() => {
    editor.clearSelection()
  })

  // register message handler once
  setMessageHandler(async (content) => {
    let sessionID = process.env.ORYNA_AGENT_SESSION_ID
    if (!sessionID) {
      const created = await sdk.client.session.create({})
      sessionID = created.data!.id
      process.env.ORYNA_AGENT_SESSION_ID = sessionID
      navigate({ type: "session", sessionID })
    }
    const model = local.model.current()
    await sdk.client.session.prompt({
      sessionID,
      parts: [{ type: "text", text: content }],
      ...(model ? { model: { providerID: model.providerID, modelID: model.modelID } } : {}),
    })
  })

  // connect/disconnect WS based on selected model
  createEffect(() => {
    const model = local.model.current()
    if (model?.providerID === "oryna-local") {
      startAgent()
    } else {
      stopAgent()
    }
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
          <TuiPluginRuntime.Slot name="home_logo" mode="replace">
            <Logo />
          </TuiPluginRuntime.Slot>
        </box>
        <box height={1} minHeight={0} flexShrink={1} />
        <box width="100%" maxWidth={promptMaxWidth()} zIndex={1000} paddingTop={1} flexShrink={0}>
          <TuiPluginRuntime.Slot name="home_prompt" mode="replace" ref={bind}>
            <Prompt ref={bind} right={
              <>
                <Show when={agentStatus().connected}>
                  <text fg={agentStatus().processing ? theme.warning : theme.success}>
                    {agentStatus().processing ? "◇" : "●"}{" "}
                  </text>
                  <text fg={theme.textMuted}>
                    {agentStatus().processing
                      ? "processing..."
                      : `Collab · ${agentStatus().url}`}
                  </text>
                </Show>
                <TuiPluginRuntime.Slot name="home_prompt_right" />
              </>
            } placeholders={placeholder} />
          </TuiPluginRuntime.Slot>
        </box>
        <TuiPluginRuntime.Slot name="home_bottom" />
        <box flexGrow={1} minHeight={0} />
        <Toast />
      </box>
      <box width="100%" flexShrink={0}>
        <TuiPluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </HomeSessionDestinationProvider>
  )
}
