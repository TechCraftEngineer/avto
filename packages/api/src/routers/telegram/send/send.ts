import {
  eq,
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const sendMessageInputSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
  type: z.enum(["text", "voice", "file"]).default("text"),
  fileId: z.string().uuid().optional(),
  voiceDuration: z.number().int().positive().optional(),
});

export const sendMessageRouter = protectedProcedure
  .input(sendMessageInputSchema)
  .handler(async ({ input, context }) => {
    const [message] = await context.db
      .insert(interviewMessage)
      .values({
        sessionId: input.sessionId,
        role: "assistant", // ����� ���������� ��� assistant
        type: input.type,
        channel: "web",
        content: input.content,
        fileId: input.fileId,
        voiceDuration: input.voiceDuration,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    // �������� ������ ������ ��� �������� � Telegram
    const sessionData = await context.db
      .select({
        id: interviewSession.id,
        chatId: responseTable.chatId,
        entityType: responseTable.entityType,
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
