import {
  eq,
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const sendMutateRouter = protectedProcedure
  .input(
    z.object({
      sessionId: z.uuid(),
      text: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const [message] = await context.db
      .insert(interviewMessage)
      .values({
        sessionId: input.sessionId,
        role: "assistant",
        type: "text",
        channel: "web",
        content: input.text,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    const sessionData = await context.db
      .select({
        id: interviewSession.id,
        chatId: responseTable.chatId,
      })
      .from(interviewSession)
      .leftJoin(
        responseTable,
        eq(interviewSession.responseId, responseTable.id),
      )
      .where(eq(interviewSession.id, input.sessionId))
      .limit(1);

    if (!sessionData[0] || !sessionData[0].chatId) {
      throw new Error("Interview session or chatId not found");
    }

    await inngest.send({
      name: "telegram/message.send",
      data: {
        messageId: message.id,
        chatId: sessionData[0].chatId,
        content: message.content ?? "",
      },
    });

    return message;
  });
