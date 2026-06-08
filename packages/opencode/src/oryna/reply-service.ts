import { appendFileSync } from "fs"

export function sendReply(content: string) {
  appendFileSync(
    "/tmp/oryna-reply",
    JSON.stringify({ cmd: "reply", args: JSON.stringify({ content }) }) + "\n",
  )
}
