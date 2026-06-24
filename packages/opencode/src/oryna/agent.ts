import { readFileSync } from "fs"
import os from "os"
import path from "path"

export function getOrynaGateId(dir: string): string {
  try {
    const config = JSON.parse(readFileSync(path.join(dir, ".orynagate"), "utf-8"))
    if (config.ticket) return config.ticket
    if (config.id && typeof config.id === "string") return config.id
  } catch {}
  return path.basename(dir)
}

export function getOrynaGateKey(dir: string): string {
  const user = os.userInfo().username || "user"
  try {
    const config = JSON.parse(readFileSync(path.join(dir, ".orynagate"), "utf-8"))
    if (config.ticket) return `sk-ticket-${user}-${config.ticket}`
    if (config.id && typeof config.id === "string") return `sk-local-${user}-${config.id}`
  } catch {}
  return `sk-local-${user}-${path.basename(dir)}`
}
