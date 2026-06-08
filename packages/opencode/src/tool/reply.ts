import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { sendReply } from "../oryna/reply-service"

export const Parameters = Schema.Struct({
  content: Schema.String.annotate({
    description: "The reply content to send back. Keep it concise.",
  }),
})

export const ReplyTool = Tool.define(
  "reply",
  Effect.gen(function* () {
    return {
      description:
        "*** Reply to a collaboration message. You MUST call this tool after completing a collaborative task. Do NOT output your response as regular text. ***",
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, _ctx: Tool.Context) =>
        Effect.gen(function* () {
          sendReply(params.content)
          return {
            title: "Replied to collaboration message",
            output: "Reply sent successfully.",
            metadata: {} as Record<string, never>,
          }
        }).pipe(Effect.orDie),
    }
  }),
)
