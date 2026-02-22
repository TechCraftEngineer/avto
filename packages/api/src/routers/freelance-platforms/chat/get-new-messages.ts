import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../orpc";

const getNewMessagesInputSchema = z.object({
  interviewSessionId: z.string().uuid(),
  lastMessageId: z.string().uuid().optional(),
});

export const getNewMessages = publicProcedure
  .input(getNewMessagesInputSchema)
  .handler(async ({ input, context }) => {
    // Проверяем существование interview session
    const session = await context.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
    });

    if (!session) {
      throw new ORPCError("NOT_FOUND", { message: "Интервью не найдено" });
    }

    // Получаем новые сообщения от бота
    const messages = await context.db.query.interviewMessage.findMany({
      where: (message, { eq, and, gt }) => {
        const conditions = [
          eq(message.sessionId, input.interviewSessionId),
          eq(message.role, "assistant"),
        ];

        if (input.lastMessageId) {
          conditions.push(gt(message.id, input.lastMessageId));
        }

        return and(...conditions);
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      limit: 10,
    });

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt,
      })),
    };
  });
