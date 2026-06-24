const REPLY_URL = process.env.ORYNA_GATE_REPLY_URL + "/reply"

export async function sendReply(content: string, to?: string) {
  if (!content) return

  if (REPLY_URL) {
    fetch(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, to: to ?? "" }),
    }).catch(() => {})
  }
}
