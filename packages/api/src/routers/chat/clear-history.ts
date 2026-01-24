import { eq } from "@qbs-autonaim/db";
import {
  chatEntityTypeEnum,
  chatMessage,
  chatSession,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const clearHistory = protectedProcedure
  .input(
    z
      .object({
        sessionId: z.string().uuid().optional(),
        entityType: z.enum(chatEntityTypeEnum.enumValues).optional(),
        entityId: z.string().uuid().optional(),
      })
      .refine(
        (v) =>
          Boolean(v.sessionId) ||
          (Boolean(v.entityType) && Boolean(v.entityId)),
        {
          message: "sessionId или (entityType, entityId) обязательны",
        },
      ),
  )
  .mutation(async ({ input, ctx }) => {
    const { sessionId, entityType, entityId } = input;
    const userId = ctx.session.user.id;

    // TODO: Проверка доступа к сущности

    // Загрузка сессии
    const session = sessionId
      ? await ctx.db.query.chatSession.findFirst({
          where: (chatSession, { and, eq }) =>
            and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId)),
        })
      : await ctx.db.query.chatSession.findFirst({
          where: (chatSession, { and, eq }) =>
            and(
              eq(
                chatSession.entityType,
                entityType as NonNullable<typeof entityType>,
              ),
              eq(
                chatSession.entityId,
                entityId as NonNullable<typeof entityId>,
              ),
              eq(chatSession.userId, userId),
            ),
        });

    if (!session) {
      return {
        success: true,
      };
    }

    // Удаление сообщений
    await ctx.db
      .delete(chatMessage)
      .where(eq(chatMessage.sessionId, session.id));

    // Сброс счетчика
    await ctx.db
      .update(chatSession)
      .set({
        messageCount: 0,
        lastMessageAt: null,
      })
      .where(eq(chatSession.id, session.id));

    return {
      success: true,
    };
  });
