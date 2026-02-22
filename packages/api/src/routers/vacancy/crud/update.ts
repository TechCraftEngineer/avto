import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancySettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { CommunicationChannelsAnalytics } from "../../../services/analytics/communication-channels";

export const update = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
      settings: updateVacancySettingsSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем, что вакансия существует и принадлежит workspace
    const existingVacancy = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    // Обновляем настройки
    // Строим патч только с определенными полями (не undefined)
    const settings = input.settings;
    const patch: Partial<typeof vacancy.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (settings.customBotInstructions !== undefined) {
      patch.customBotInstructions = settings.customBotInstructions;
    }
    if (settings.customScreeningPrompt !== undefined) {
      patch.customScreeningPrompt = settings.customScreeningPrompt;
    }
    if (settings.customInterviewQuestions !== undefined) {
      patch.customInterviewQuestions = settings.customInterviewQuestions;
    }
    if (settings.customOrganizationalQuestions !== undefined) {
      patch.customOrganizationalQuestions =
        settings.customOrganizationalQuestions;
    }
    if (settings.enabledCommunicationChannels !== undefined) {
      patch.enabledCommunicationChannels =
        settings.enabledCommunicationChannels;
    }
    if (settings.welcomeMessageTemplates !== undefined) {
      patch.welcomeMessageTemplates = settings.welcomeMessageTemplates;
    }
    if (settings.customDomainId !== undefined) {
      // Преобразуем пустую строку в null
      patch.customDomainId =
        settings.customDomainId === null || settings.customDomainId === ""
          ? null
          : settings.customDomainId;
    }

    const result = await context.db
      .update(vacancy)
      .set(patch)
      .where(
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    // Проверяем, что строка была обновлена (race condition: вакансия могла быть удалена)
    if (!result[0]) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    // Отслеживаем изменения настроек каналов общения
    if (settings.enabledCommunicationChannels) {
      try {
        const analytics = new CommunicationChannelsAnalytics(context.db);

        // Отслеживаем только изменившиеся каналы
        for (const [channel, enabled] of Object.entries(
          settings.enabledCommunicationChannels,
        )) {
          const previousEnabled =
            existingVacancy.enabledCommunicationChannels?.[
              channel as keyof typeof existingVacancy.enabledCommunicationChannels
            ] ?? false;
          if (enabled !== previousEnabled) {
            await analytics.trackChannelSelection({
              workspaceId: input.workspaceId,
              vacancyId: input.vacancyId,
              channel: channel as "webChat" | "telegram",
              enabled: enabled as boolean,
              metadata: {
                userId: context.session.user.id,
              },
            });
          }
        }
      } catch (error) {
        // Не прерываем обновление из-за ошибки аналитики
        console.error("Failed to track channel selection:", error);
      }
    }

    return result[0];
  });
