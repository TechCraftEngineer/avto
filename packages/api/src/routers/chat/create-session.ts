import { chatEntityTypeEnum, chatSession, vacancy } from "@qbs-autonaim/db/schema";
import { eq } from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { chatRegistry } from "../../services/chat/registry";
import { CommunicationChannelsAnalytics } from "../../services/analytics/communication-channels";
import { protectedProcedure } from "../../trpc";

export const createSession = protectedProcedure
  .input(
    z.object({
      entityType: z.enum(chatEntityTypeEnum.enumValues),
      entityId: z.string().uuid(),
      title: z.string().min(1).max(500).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { entityType, entityId, title } = input;
    const userId = ctx.session.user.id;

    if (!chatRegistry.isRegistered(entityType)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Тип сущности ${entityType} не поддерживается`,
      });
    }

    // TODO: Проверка доступа к сущности

    const [session] = await ctx.db
      .insert(chatSession)
      .values({
        entityType,
        entityId,
        userId,
        title,
        messageCount: 0,
      })
      .returning();

    if (!session) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать сессию чата",
      });
    }

    // Отслеживаем начало веб-чата для вакансий
    if (entityType === "vacancy") {
      try {
        // Получаем workspaceId из вакансии
        const vacancyData = await ctx.db.query.vacancy.findFirst({
          where: eq(vacancy.id, entityId),
          columns: { workspaceId: true },
        });

        if (vacancyData) {
          const analytics = new CommunicationChannelsAnalytics(ctx.db);
          await analytics.trackWebChatStart({
            workspaceId: vacancyData.workspaceId,
            vacancyId: entityId,
            sessionId: session.id,
            metadata: {
              userId: ctx.session.user.id,
            },
          });
        }
      } catch (error) {
        // Не прерываем создание сессии из-за ошибки аналитики
        console.error("Failed to track web chat start:", error);
      }
    }

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
    };
  });
