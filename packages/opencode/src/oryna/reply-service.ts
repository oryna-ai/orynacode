import { appendFileSync } from "fs"

const FILE = `/tmp/oryna-reply-${process.pid}`

export function sendReply(content: string, to?: string) {
  const args: Record<string, string> = { content }
  if (to) args.to = to
  appendFileSync(
    FILE,
    JSON.stringify({ cmd: "reply", args: JSON.stringify(args) }) + "\n",
  )
}
