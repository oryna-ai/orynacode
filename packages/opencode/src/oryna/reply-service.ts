let pending: string[] = []

export function sendReply(content: string) {
  pending.push(JSON.stringify({ cmd: "reply", args: JSON.stringify({ content }) }))
}

export function drainReplies(): string[] {
  const batch = pending
  pending = []
  return batch
}
