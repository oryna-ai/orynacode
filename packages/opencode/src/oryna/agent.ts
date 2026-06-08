import { readFileSync } from "fs"
import { setAgentStatus } from "./agent-signal"
import os from "os"
import path from "path"

const REPLY_FILE = "/tmp/oryna-reply"
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let replyWatchTimer: ReturnType<typeof setInterval> | null = null
let stopped = false
let connecting = false
let onMessage: ((content: string, from: string) => Promise<void>) | null = null

export function setMessageHandler(fn: (content: string, from: string) => Promise<void>) {
  onMessage = fn
}

function readAuthUrl(): string | undefined {
  try {
    const dataDir = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
    const authPath = path.join(dataDir, "orynacode", "auth.json")
    const auth = JSON.parse(readFileSync(authPath, "utf-8"))
    const local = auth?.["orynagate"]
    if (local?.metadata?.url) return local.metadata.url
  } catch {}
  return undefined
}

function startReplyWatch() {
  if (replyWatchTimer) return
  let offset = 0
  replyWatchTimer = setInterval(() => {
    try {
      const raw = readFileSync(REPLY_FILE, "utf-8")
      const lines = raw.split("\n")
      for (let i = offset; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        if (ws?.readyState === WebSocket.OPEN) ws.send(line)
      }
      offset = lines.length
    } catch {}
  }, 300)
}

export function start() {
  stopped = false
  const url = process.env.ORYNA_GATE_URL || readAuthUrl()
  if (!url) return
  if (connecting) return
  connecting = true

  const host = new URL(url).host
  const user = os.userInfo().username || "user"
  const token = `sk-local-${user}-${path.basename(process.cwd())}`
  const wsUrl = `ws://${host}/ws?token=${token}`

  const connect = () => {
    const socket = new WebSocket(wsUrl)
    ws = socket

    socket.addEventListener("open", () => {
      startReplyWatch()
      setAgentStatus({ connected: true, processing: false, url: host })
      heartbeatTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("__PING__")
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
        const from = msg.data?.from || "unknown"
        if (!content) return

        setTimeout(() => setAgentStatus({ connected: true, processing: true, url: host }), 0)
        if (onMessage) await onMessage(content, from)
        setTimeout(() => setAgentStatus({ connected: true, processing: false, url: host }), 0)
      } catch {}
    })

    socket.addEventListener("close", () => {
      connecting = false
      ws = null
      setAgentStatus({ connected: false, processing: false, url: host })
      if (!stopped) reconnectTimer = setTimeout(connect, 3000)
    })

    socket.addEventListener("error", () => {
      socket.close()
    })
  }

  connect()
}

export function stop() {
  connecting = false
  stopped = true
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  if (replyWatchTimer) { clearInterval(replyWatchTimer); replyWatchTimer = null }
  if (ws) { ws.close(); ws = null }
  setAgentStatus({ connected: false, processing: false, url: "" })
}
