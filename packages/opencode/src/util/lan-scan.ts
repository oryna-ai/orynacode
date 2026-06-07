import os from "os"
import net from "net"

export interface ScannerResult {
  url: string
}

function localSubnets(): string[] {
  const subnets = new Set<string>()
  const interfaces = os.networkInterfaces()
  for (const [, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.family !== "IPv4" || addr.internal) continue
      const parts = addr.address.split(".")
      if (parts.length !== 4) continue
      if (parts[0] === "127") continue
      const base = parts.slice(0, 3).map(Number)
      for (let d = -3; d <= 3; d++) {
        const third = base[2] + d
        if (third < 0 || third > 255) continue
        subnets.add(`${base[0]}.${base[1]}.${third}`)
      }
    }
  }
  return [...subnets]
}

function checkPort(host: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeout)
    socket.on("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.on("error", () => resolve(false))
    socket.on("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, host)
  })
}

async function checkProxy(host: string, port: number): Promise<ScannerResult | undefined> {
  const url = `http://${host}:${port}`
  try {
    const res = await fetch(`${url}/api.json`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) return { url }
  } catch {}
  return undefined
}

async function scanSubnet(subnet: string, port: number): Promise<ScannerResult[]> {
  const portTimeout = 200
  const concurrency = 30
  const hosts = new Array(254).fill(0).map((_, i) => `${subnet}.${i + 1}`)
  const all: ScannerResult[] = []

  for (let i = 0; i < hosts.length; i += concurrency) {
    const batch = hosts.slice(i, i + concurrency)
    const results = await Promise.all(
      batch.map(async (host) => {
        const open = await checkPort(host, port, portTimeout)
        if (!open) return
        return checkProxy(host, port)
      }),
    )
    for (const result of results) {
      if (result) all.push(result)
    }
    if (all.length > 0) return all
  }
  return all
}

export async function scanLan(): Promise<ScannerResult[]> {
  const subnets = localSubnets()
  if (subnets.length === 0) return []

  const port = 9527
  const all: ScannerResult[] = []
  for (const subnet of subnets) {
    const results = await scanSubnet(subnet, port)
    all.push(...results)
  }

  return all
}
