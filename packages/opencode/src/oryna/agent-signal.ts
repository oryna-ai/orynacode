import { createRoot, createSignal } from "solid-js"

export type AgentState = {
  connected: boolean
  processing: boolean
  ready: boolean
  url: string
}

export const agentStatus = createRoot(() =>
  createSignal<AgentState>({ connected: false, processing: false, ready: false, url: "" })[0],
)
