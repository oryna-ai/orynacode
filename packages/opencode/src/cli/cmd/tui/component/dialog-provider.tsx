import { createMemo, createSignal, onCleanup, onMount, createEffect, Show, For } from "solid-js"
import { useSync } from "@tui/context/sync"
import { map, pipe, sortBy } from "remeda"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "../context/sdk"
import { DialogPrompt } from "../ui/dialog-prompt"
import { Link } from "../ui/link"
import { useTheme } from "../context/theme"
import { TextAttributes } from "@opentui/core"
import type { ProviderAuthAuthorization, ProviderAuthMethod } from "@opencode-ai/sdk/v2"
import { DialogModel } from "./dialog-model"
import * as Clipboard from "@tui/util/clipboard"
import { useToast } from "../ui/toast"
import { isConsoleManagedProvider } from "@tui/util/provider-origin"
import { useConnected } from "./use-connected"
import { scanLan } from "@/util/lan-scan"
import { start as startAgent } from "@/oryna/agent"
import { Spinner } from "./spinner"
import { useBindings } from "../keymap"
import open from "open"
import path from "path"
import os from "os"

const PROVIDER_PRIORITY: Record<string, number> = {
  oryna: 0,
  "orynagate": 1,
}

const CUSTOM_PROVIDER_OPTION_VALUE = "__opencode_custom_provider__"
const CUSTOM_PROVIDER_ID = /^[a-z0-9][a-z0-9-_]*$/

type ProviderOptionBase = {
  title: string
  value: string
  description?: string
  category: string
}

type ProviderOption =
  | (ProviderOptionBase & {
      type: "provider"
      providerID: string
    })
  | (ProviderOptionBase & {
      type: "custom"
    })

export function providerOptions(list: { id: string; name: string }[]): ProviderOption[] {
  return [
    ...pipe(
      list,
      sortBy((x) => PROVIDER_PRIORITY[x.id] ?? 99),
      map((provider) => ({
        type: "provider" as const,
        title: provider.name,
        value: provider.id,
        providerID: provider.id,
        description: {
          oryna: "Cloud API — China's Best LLMs, Now Global.",
          "orynagate": "Deploy on your own network",
        }[provider.id],
        category: "Oryna",
      })),
    ),
  ]
}

export function normalizeCustomProviderID(value: string) {
  const providerID = value.trim().replace(/^@ai-sdk\//, "")
  if (!CUSTOM_PROVIDER_ID.test(providerID)) return
  return providerID
}

export function createDialogProviderOptions() {
  const sync = useSync()
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()
  const { theme } = useTheme()
  const onboarded = useConnected()

  async function promptCustomProviderID(): Promise<string | undefined> {
    const value = await DialogPrompt.show(dialog, "Other", {
      placeholder: "Provider id",
      description: () => (
        <text fg={theme.textMuted}>
          This only stores a credential. Configure the provider in orynacode.json to use it.
        </text>
      ),
    })
    if (value === null) return

    const providerID = normalizeCustomProviderID(value)
    if (providerID) return providerID

    toast.show({
      variant: "error",
      message:
        "Provider ids must start with a lowercase letter or number and only use lowercase letters, numbers, hyphens, and underscores",
    })
    return promptCustomProviderID()
  }

  const options = createMemo(() => {
    return pipe(
      providerOptions(sync.data.provider_next.all),
      map((provider) => {
        if (provider.type === "custom") {
          return {
            title: provider.title,
            value: provider.value,
            description: provider.description,
            category: provider.category,
            async onSelect() {
              const providerID = await promptCustomProviderID()
              if (!providerID) return
              return dialog.replace(() => <ApiMethod providerID={providerID} title="API key" custom />)
            },
          }
        }

        const providerID = provider.providerID
        const consoleManaged = isConsoleManagedProvider(sync.data.console_state.consoleManagedProviders, providerID)
        const connected = sync.data.provider_next.connected.includes(providerID)

        return {
          title: provider.title,
          value: provider.value,
          description: provider.description,
          footer: consoleManaged ? sync.data.console_state.activeOrgName : undefined,
          category: provider.category,
          gutter: connected && onboarded() ? () => <text fg={theme.success}>✓</text> : undefined,
          async onSelect() {
            if (consoleManaged) return

            if (providerID === "orynagate") {
              dialog.replace(() => <ConnectLocal onClose={() => dialog.clear()} />)
              return
            }

            const methods = sync.data.provider_auth[providerID] ?? [
              {
                type: "api",
                label: "API key",
              },
            ]
            let index: number | null = 0
            if (methods.length > 1) {
              index = await new Promise<number | null>((resolve) => {
                dialog.replace(
                  () => (
                    <DialogSelect
                      title="Select auth method"
                      options={methods.map((x, index) => ({
                        title: x.label,
                        value: index,
                      }))}
                      onSelect={(option) => resolve(option.value)}
                    />
                  ),
                  () => resolve(null),
                )
              })
            }
            if (index == null) return
            const method = methods[index]
            if (method.type === "oauth") {
              let inputs: Record<string, string> | undefined
              if (method.prompts?.length) {
                const value = await PromptsMethod({
                  dialog,
                  prompts: method.prompts,
                })
                if (!value) return
                inputs = value
              }

              const result = await sdk.client.provider.oauth.authorize({
                providerID,
                method: index,
                inputs,
              })
              if (result.error) {
                toast.show({
                  variant: "error",
                  message: JSON.stringify(result.error),
                })
                dialog.clear()
                return
              }
              if (result.data?.method === "code") {
                dialog.replace(() => (
                  <CodeMethod providerID={providerID} title={method.label} index={index} authorization={result.data!} />
                ))
              }
              if (result.data?.method === "auto") {
                dialog.replace(() => (
                  <AutoMethod providerID={providerID} title={method.label} index={index} authorization={result.data!} />
                ))
              }
            }
            if (method.type === "api") {
              let metadata: Record<string, string> | undefined
              if (method.prompts?.length) {
                const value = await PromptsMethod({ dialog, prompts: method.prompts })
                if (!value) return
                metadata = value
              }
              return dialog.replace(() => (
                <ApiMethod providerID={providerID} title={method.label} metadata={metadata} />
              ))
            }
          },
        }
      }),
    )
  })
  return options
}

export function DialogProvider() {
  const options = createDialogProviderOptions()
  return <DialogSelect title="Connect" options={options()} />
}

interface AutoMethodProps {
  index: number
  providerID: string
  title: string
  authorization: ProviderAuthAuthorization
}
function AutoMethod(props: AutoMethodProps) {
  const { theme } = useTheme()
  const sdk = useSDK()
  const dialog = useDialog()
  const sync = useSync()
  const toast = useToast()

  useBindings(() => ({
    bindings: [
      {
        key: "c",
        desc: "Copy provider code",
        group: "Dialog",
        cmd: () => {
          const code =
            props.authorization.instructions.match(/[A-Z0-9]{4}-[A-Z0-9]{4,5}/)?.[0] ?? props.authorization.url
          Clipboard.copy(code)
            .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
            .catch(toast.error)
        },
      },
    ],
  }))

  onMount(async () => {
    const result = await sdk.client.provider.oauth.callback({
      providerID: props.providerID,
      method: props.index,
    })
    if (result.error) {
      toast.show({
        variant: "error",
        message:
          "name" in result.error && result.error.name === "ProviderAuthOauthCallbackFailed"
            ? "OAuth authorization failed. Try /connect again."
            : JSON.stringify(result.error),
      })
      dialog.clear()
      return
    }
    await sdk.client.instance.dispose()
    await sync.bootstrap()
    dialog.replace(() => <DialogModel providerID={props.providerID} />)
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {props.title}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      <box gap={1}>
        <Link href={props.authorization.url} fg={theme.primary} />
        <text fg={theme.textMuted}>{props.authorization.instructions}</text>
      </box>
      <text fg={theme.textMuted}>Waiting for authorization...</text>
      <text fg={theme.text}>
        c <span style={{ fg: theme.textMuted }}>copy</span>
      </text>
    </box>
  )
}

interface CodeMethodProps {
  index: number
  title: string
  providerID: string
  authorization: ProviderAuthAuthorization
}
function CodeMethod(props: CodeMethodProps) {
  const { theme } = useTheme()
  const sdk = useSDK()
  const sync = useSync()
  const dialog = useDialog()
  const [error, setError] = createSignal(false)

  return (
    <DialogPrompt
      title={props.title}
      placeholder="Authorization code"
      onConfirm={async (value) => {
        const { error } = await sdk.client.provider.oauth.callback({
          providerID: props.providerID,
          method: props.index,
          code: value,
        })
        if (!error) {
          await sdk.client.instance.dispose()
          await sync.bootstrap()
          dialog.replace(() => <DialogModel providerID={props.providerID} />)
          return
        }
        setError(true)
      }}
      description={() => (
        <box gap={1}>
          <text fg={theme.textMuted}>{props.authorization.instructions}</text>
          <Link href={props.authorization.url} fg={theme.primary} />
          <Show when={error()}>
            <text fg={theme.error}>Invalid code</text>
          </Show>
        </box>
      )}
    />
  )
}

interface ApiMethodProps {
  providerID: string
  title: string
  metadata?: Record<string, string>
  custom?: boolean
}
function ApiMethod(props: ApiMethodProps) {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const toast = useToast()
  const { theme } = useTheme()

  return (
    <DialogPrompt
      title={props.title}
      placeholder="API key"
      description={
        {
          opencode: (
            <box gap={1}>
              <text fg={theme.textMuted}>
                OrynaCode Zen gives you access to all the best coding models at the cheapest prices with a single API
                key.
              </text>
              <text fg={theme.text}>
                Go to <span style={{ fg: theme.primary }}>https://oryna.ai/zen</span> to get a key
              </text>
            </box>
          ),
          oryna: (
            <box gap={1}>
              <text fg={theme.textMuted}>
                Oryna AI provides access to the best AI models through a single API.
              </text>
              <text fg={theme.text}>
                Go to <span style={{ fg: theme.primary }}>https://oryna.ai</span> to get your API key
              </text>
            </box>
          ),
          "opencode-go": (
            <box gap={1}>
              <text fg={theme.textMuted}>
                OrynaCode Go is a $10 per month subscription that provides reliable access to popular open coding models
                with generous usage limits.
              </text>
              <text fg={theme.text}>
                Go to <span style={{ fg: theme.primary }}>https://oryna.ai/go</span> and enable OrynaCode Go
              </text>
            </box>
          ),
        }[props.providerID] ?? undefined
      }
      onConfirm={async (value) => {
        if (!value) return
        await sdk.client.auth.set({
          providerID: props.providerID,
          auth: {
            type: "api",
            key: value,
            ...(props.metadata ? { metadata: props.metadata } : {}),
          },
        })
        await sdk.client.instance.dispose()
        await sync.bootstrap()
        if (props.custom && !sync.data.provider_next.all.some((provider) => provider.id === props.providerID)) {
          toast.show({
            variant: "info",
            message: `Saved credential for ${props.providerID}. Configure it in orynacode.json to use it.`,
          })
          dialog.clear()
          return
        }
        dialog.replace(() => <DialogModel providerID={props.providerID} />)
      }}
    />
  )
}

interface PromptsMethodProps {
  dialog: ReturnType<typeof useDialog>
  prompts: NonNullable<ProviderAuthMethod["prompts"]>[number][]
}
async function PromptsMethod(props: PromptsMethodProps) {
  const inputs: Record<string, string> = {}
  for (const prompt of props.prompts) {
    if (prompt.when) {
      const value = inputs[prompt.when.key]
      if (value === undefined) continue
      const matches = prompt.when.op === "eq" ? value === prompt.when.value : value !== prompt.when.value
      if (!matches) continue
    }

    if (prompt.type === "select") {
      const value = await new Promise<string | null>((resolve) => {
        props.dialog.replace(
          () => (
            <DialogSelect
              title={prompt.message}
              options={prompt.options.map((x) => ({
                title: x.label,
                value: x.value,
                description: x.hint,
              }))}
              onSelect={(option) => resolve(option.value)}
            />
          ),
          () => resolve(null),
        )
      })
      if (value === null) return null
      inputs[prompt.key] = value
      continue
    }

    const value = await new Promise<string | null>((resolve) => {
      props.dialog.replace(
        () => (
          <DialogPrompt title={prompt.message} placeholder={prompt.placeholder} onConfirm={(value) => resolve(value)} />
        ),
        () => resolve(null),
      )
    })
    if (value === null) return null
    inputs[prompt.key] = value
  }
  return inputs
}

function ConnectLocal(props: { onClose: () => void }) {
  const { theme } = useTheme()
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const [status, setStatus] = createSignal<"scanning" | "found" | "multiple" | "not-found" | "validating" | "invalid">("scanning")
  const [scanSeconds, setScanSeconds] = createSignal(15)
  const [proxyUrls, setProxyUrls] = createSignal<string[]>([])
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [manual, setManual] = createSignal(false)
  const [textareaTarget, setTextareaTarget] = createSignal<any>()
  let scanTimer: any
  let textarea: any

  useBindings(() => ({
    enabled: status() === "multiple",
    commands: [
      { name: "connect.local.list.up", title: "Up", category: "Dialog", run: () => setSelectedIndex((i) => Math.max(0, i - 1)) },
      { name: "connect.local.list.down", title: "Down", category: "Dialog", run: () => setSelectedIndex((i) => Math.min(proxyUrls().length - 1, i + 1)) },
      { name: "connect.local.list.confirm", title: "Connect", category: "Dialog", run: () => connect(proxyUrls()[selectedIndex()]) },
      { name: "connect.local.list.back", title: "Back", category: "Dialog", run: () => setStatus("not-found") },
    ],
    bindings: [
      { key: "up", cmd: "connect.local.list.up" },
      { key: "down", cmd: "connect.local.list.down" },
      { key: "return", cmd: "connect.local.list.confirm" },
      { key: "escape", cmd: "connect.local.list.back" },
    ],
  }))

  useBindings(() => ({
    target: textareaTarget,
    enabled: manual() && textareaTarget() !== undefined,
    priority: 1,
    commands: [
      { name: "connect.local.submit", title: "Connect", category: "Dialog", run: () => { if (textarea) onManualConfirm(textarea.plainText) } },
    ],
    bindings: [{ key: "return", cmd: "connect.local.submit" }],
  }))

  createEffect(() => {
    if (!manual() || !textarea || textarea.isDestroyed) return
    setTimeout(() => {
      if (!textarea || textarea.isDestroyed) return
      textarea.focus()
    }, 1)
  })

  onMount(async () => {
    scanTimer = setInterval(() => setScanSeconds((s) => Math.max(0, s - 1)), 1000)

    try {
      const results = await Promise.race([
        scanLan(),
        new Promise<Awaited<ReturnType<typeof scanLan>>>((r) => setTimeout(() => r([]), 15000)),
      ])
      clearInterval(scanTimer)
      if (results.length > 1) {
        setProxyUrls(results.map((r) => r.url))
        setStatus("multiple")
      } else if (results.length === 1) {
        const url = results[0].url
        setProxyUrls([url])
        setStatus("found")
        setTimeout(() => connect(url), 800)
      } else {
        setStatus("not-found")
      }
    } catch {
      clearInterval(scanTimer)
      setStatus("not-found")
    }
  })

  onCleanup(() => clearInterval(scanTimer))

  async function connect(url: string) {
    process.env.ORYNA_GATE_URL = url
    await sdk.client.auth.set({
      providerID: "orynagate",
      auth: { type: "api", key: `sk-local-${os.userInfo().username || "user"}-${path.basename(process.cwd())}`, metadata: { url } },
    })
    await sdk.client.instance.dispose()
    await sync.bootstrap()
    dialog.replace(() => <DialogModel providerID="orynagate" />)
    startAgent()
  }

  async function onManualConfirm(value: string) {
    const clean = value.trim().replace(/\/+$/, "")
    if (!clean) return
    setManual(false)
    setStatus("validating")
    try {
      const res = await fetch(`${clean}/api.json`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        connect(clean)
      } else {
        setStatus("invalid")
      }
    } catch {
      setStatus("invalid")
    }
  }

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          OrynaGate
        </text>
        <text fg={theme.textMuted} onMouseUp={props.onClose}>
          esc
        </text>
      </box>

      <Show when={manual()} fallback={
        <>
          <Show when={status() === "scanning"}>
            <box flexGrow={1} alignItems="center" justifyContent="center" gap={1} paddingTop={2} paddingBottom={2}>
              <Spinner color={theme.primary} />
              <text fg={theme.textMuted}>Scanning local network for OrynaGate ({scanSeconds()}s)</text>
              <text fg={theme.textMuted}>Checking port 9527 in nearby subnets</text>
            </box>
          </Show>

          <Show when={status() === "found"}>
            <box gap={1} paddingTop={2}>
              <text fg={theme.success}>✓ Found OrynaGate</text>
              <text fg={theme.textMuted}>{proxyUrls()[0]}</text>
              <text fg={theme.textMuted}>Connecting...</text>
            </box>
          </Show>

          <Show when={status() === "multiple"}>
            <box gap={1} paddingTop={1}>
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.success}>✓ Found {proxyUrls().length} OrynaGate servers</text>
                <text fg={theme.textMuted} onMouseUp={() => setStatus("not-found")}>← Back</text>
              </box>
              <For each={proxyUrls()}>
                {(url, index) => {
                  const name = `OrynaGate (${new URL(url).hostname})`
                  return (
                    <box flexDirection="row" gap={1}>
                      <text fg={selectedIndex() === index() ? theme.primary : theme.textMuted}>
                        {selectedIndex() === index() ? "●" : "○"}
                      </text>
                      <text
                        fg={selectedIndex() === index() ? theme.primary : theme.text}
                        onMouseUp={() => connect(url)}
                      >
                        {name}
                      </text>
                    </box>
                  )
                }}
              </For>
              <box paddingTop={1}>
                <text fg={theme.textMuted}>↑↓ to select · enter to connect · esc to go back</text>
              </box>
            </box>
          </Show>

          <Show when={status() === "not-found" || status() === "validating" || status() === "invalid"}>
            <box gap={1} paddingTop={1}>
              <Show when={status() === "not-found"}>
                <text fg={theme.warning}>No OrynaGate found on your network</text>
                <text fg={theme.textMuted}>OrynaGate lets you run models on your own infrastructure.</text>
              </Show>
              <Show when={status() === "validating"}>
                <box flexDirection="row" gap={1}>
                  <Spinner color={theme.primary} />
                  <text fg={theme.textMuted}>Validating...</text>
                </box>
              </Show>
              <Show when={status() === "invalid"}>
                <text fg={theme.error}>Could not reach OrynaGate at this address</text>
              </Show>
              <box gap={2} paddingTop={1}>
                <text fg={theme.primary} onMouseUp={() => setManual(true)}>
                  ● Enter IP manually
                </text>
              </box>
              <box gap={1} paddingTop={1} flexDirection="row">
                <text fg={theme.textMuted}>Don't have OrynaGate? Download at</text>
                <text fg={theme.primary} onMouseUp={() => open("https://oryna.ai").catch(() => {})}>oryna.ai</text>
              </box>
            </box>
          </Show>
        </>
      }>
        <box gap={1} paddingTop={1}>
          <text fg={theme.textMuted}>Enter OrynaGate address:</text>
          <textarea
            height={3}
            ref={(val: any) => {
              textarea = val
              setTextareaTarget(val)
            }}
            placeholder="http://192.168.1.100:9527"
            placeholderColor={theme.textMuted}
            textColor={theme.text}
            focusedTextColor={theme.text}
            cursorColor={theme.text}
          />
          <box flexDirection="row" gap={2}>
            <text fg={theme.primary} onMouseUp={() => textarea && onManualConfirm(textarea.plainText)}>● Connect</text>
            <text fg={theme.textMuted} onMouseUp={() => setManual(false)}>Cancel</text>
          </box>
        </box>
      </Show>
    </box>
  )
}
