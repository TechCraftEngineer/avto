import { chatEntityTypeEnum } from "@qbs-autonaim/db/schema";
import { paginationLimitSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const getHistory = protectedProcedure
  .input(
    z
      .object({
        sessionId: z.string().uuid().optional(),
        entityType: z.enum(chatEntityTypeEnum.enumValues).optional(),
        entityId: z.string().optional(),
        limit: paginationLimitSchema({ default: 50, max: 50 }),
      })
      .refine(
        (v) =>
          Boolean(v.sessionId) ||
          (Boolean(v.entityType) && Boolean(v.entityId)),
        {
          message: "sessionId или (entityType, entityId) обязательны",
        },
      )
      .refine(
        (v) => {
          // Для gig и vacancy требуется UUID
          if (
            v.entityId &&
            v.entityType &&
            ["gig", "vacancy"].includes(v.entityType)
          ) {
            return z.string().uuid().safeParse(v.entityId).success;
          }
          return true;
        },
        {
          message: "entityId должен быть UUID для типов gig и vacancy",
          path: ["entityId"],
        },
      ),
  )
  .query(async ({ input, ctx }) => {
    const { sessionId, entityType, entityId, limit } = input;
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
        messages: [],
        hasMore: false,
      };
    }

    // Загрузка сообщений
    const messages = await ctx.db.query.chatMessage.findMany({
      where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
      orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
      limit: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: resultMessages.reverse().map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        quickReplies: msg.quickReplies ?? undefined,
        metadata: msg.metadata ?? undefined,
        createdAt: msg.createdAt,
      })),
      hasMore,
    };
  });
