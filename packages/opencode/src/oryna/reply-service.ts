import { appendFileSync } from "fs"

const FILE = `/tmp/oryna-reply-${process.pid}`

export function sendReply(content: string) {
  appendFileSync(
    FILE,
    JSON.stringify({ cmd: "reply", args: JSON.stringify({ content }) }) + "\n",
  )
}
