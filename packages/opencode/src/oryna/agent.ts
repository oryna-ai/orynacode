import { readFileSync } from "fs"
import { setAgentStatus } from "@/cli/cmd/tui/context/agent"
import os from "os"
import path from "path"

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let stopped = false
let onMessage: ((msg: string) => Promise<void>) | null = null

export function setMessageHandler(fn: (msg: string) => Promise<void>) {
  onMessage = fn
}

function readAuthUrl(): string | undefined {
  try {
    const dataDir = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
    const authPath = path.join(dataDir, "orynacode", "auth.json")
    const auth = JSON.parse(readFileSync(authPath, "utf-8"))
    const local = auth?.["oryna-local"]
    if (local?.metadata?.url) return local.metadata.url
  } catch {}
  return undefined
}

function cleanup() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
}

export function start() {
  stopped = false
  const url = process.env.ORYNA_LOCAL_URL || readAuthUrl()
  if (!url) return

  const host = new URL(url).host
  const user = os.userInfo().username || "user"
  const token = `sk-local-${user}-${path.basename(process.cwd())}`
  const wsUrl = `ws://${host}/ws?token=${token}`

  const connect = () => {
    if (ws) return
    const socket = new WebSocket(wsUrl)
    ws = socket

    socket.addEventListener("open", () => {
      setAgentStatus({ connected: true, processing: false, url: host })
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send("__PING__")
        }
      }, 30000)
    })

    socket.addEventListener("message", async (event) => {
      try {
        const msg = JSON.parse(event.data.toString())
        if (!msg.success) return
        if (msg.recv === "hello") return
        if (msg.recv === "error") return
        if (msg.recv !== "message") return

        const content = msg.data?.content
        if (!content) return

        setTimeout(() => setAgentStatus({ connected: true, processing: true, url: host }), 0)

        if (onMessage) {
          await onMessage(content)
        }

        setTimeout(() => setAgentStatus({ connected: true, processing: false, url: host }), 0)
      } catch {}
    })

    socket.addEventListener("close", () => {
      if (ws === socket) ws = null
      setAgentStatus({ connected: false, processing: false, url: host })
      if (!stopped) reconnectTimer = setTimeout(connect, 3000)
    })

    socket.addEventListener("error", () => {
      socket.close()
      if (ws === socket) ws = null
    })
  }

  connect()
}

export function stop() {
  stopped = true
  cleanup()
  setAgentStatus({ connected: false, processing: false, url: "" })
}
