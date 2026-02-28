import { ORPCError } from "@orpc/server";
import { chatEntityTypeEnum } from "@qbs-autonaim/db/schema";
import { paginationLimitSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { chatRegistry } from "../../services/chat/registry";

export const listSessions = protectedProcedure
  .input(
    z
      .object({
        entityType: z.enum(chatEntityTypeEnum.enumValues),
        entityId: z.string(),
        limit: paginationLimitSchema({ default: 20, max: 50 }),
      })
      .refine(
        (v) => {
          // Для gig и vacancy требуется UUID
          if (["gig", "vacancy"].includes(v.entityType)) {
            return z.uuid().safeParse(v.entityId).success;
          }
          return true;
        },
        {
          message: "entityId должен быть UUID для типов gig и vacancy",
          path: ["entityId"],
        },
      ),
  )
  .handler(async ({ input, context }) => {
    const { entityType, entityId, limit } = input;
    const userId = context.session.user.id;

    if (!chatRegistry.isRegistered(entityType)) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Тип сущности ${entityType} не поддерживается`,
      });
    }

    // TODO: Проверка доступа к сущности

    const sessions = await context.db.query.chatSession.findMany({
      where: (chatSession, { and, eq }) =>
        and(
          eq(chatSession.entityType, entityType),
          eq(chatSession.entityId, entityId),
          eq(chatSession.userId, userId),
        ),
      orderBy: (chatSession, { desc }) => [desc(chatSession.updatedAt)],
      limit,
    });

    const sessionsWithPreview = await Promise.all(
      sessions.map(async (session) => {
        const lastMessage = await context.db.query.chatMessage.findFirst({
          where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
          orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
        });

        return {
          id: session.id,
          entityType: session.entityType,
          entityId: session.entityId,
          title: session.title,
          status: session.status,
          messageCount: session.messageCount,
          lastMessageAt: session.lastMessageAt,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                role: lastMessage.role,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      }),
    );

    return {
      sessions: sessionsWithPreview,
    };
  });
