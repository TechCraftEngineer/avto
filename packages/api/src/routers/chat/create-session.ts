import { eq } from "@qbs-autonaim/db";
import {
  chatEntityTypeEnum,
  chatSession,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { CommunicationChannelsAnalytics } from "../../services/analytics/communication-channels";
import { chatRegistry } from "../../services/chat/registry";
import { protectedProcedure } from "../../orpc";

export const createSession = protectedProcedure
  .input(
    z
      .object({
        entityType: z.enum(chatEntityTypeEnum.enumValues),
        entityId: z.string(),
        title: z.string().min(1).max(500).optional(),
      })
      .refine(
        (v) => {
          // Для gig и vacancy требуется UUID
          if (["gig", "vacancy"].includes(v.entityType)) {
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
  .handler(async ({ input, context }) => {
    const { entityType, entityId, title } = input;
    const userId = context.session.user.id;

    if (!chatRegistry.isRegistered(entityType)) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: `Тип сущности ${entityType} не поддерживается`,
      });
    }

    // TODO: Проверка доступа к сущности

    const [session] = await context.db
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
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось создать сессию чата", });
    }

    // Отслеживаем начало веб-чата для вакансий
    if (entityType === "vacancy") {
      try {
        // Получаем workspaceId из вакансии
        const vacancyData = await context.db.query.vacancy.findFirst({
          where: eq(vacancy.id, entityId),
          columns: { workspaceId: true },
        });

        if (vacancyData) {
          const analytics = new CommunicationChannelsAnalytics(context.db);
          await analytics.trackWebChatStart({
            workspaceId: vacancyData.workspaceId,
            vacancyId: entityId,
            sessionId: session.id,
            metadata: {
              userId: context.session.user.id,
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
