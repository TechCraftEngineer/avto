import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../../trpc";

const getNewMessagesInputSchema = z.object({
  interviewSessionId: z.string().uuid(),
  lastMessageId: z.string().uuid().optional(),
});

export const getNewMessages = publicProcedure
  .input(getNewMessagesInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем существование interview session
    const session = await ctx.db.query.interviewSession.findFirst({
      where: (interviewSession, { eq }) =>
        eq(interviewSession.id, input.interviewSessionId),
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Интервью не найдено",
      });
    }

    // Получаем новые сообщения от бота
    const messages = await ctx.db.query.interviewMessage.findMany({
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
