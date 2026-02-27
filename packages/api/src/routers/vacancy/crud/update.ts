import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancySettingsSchema,
  vacancyWorkspaceInputSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { CommunicationChannelsAnalytics } from "../../../services/analytics/communication-channels";
import { ensureFound } from "../../../utils/ensure-found";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const update = protectedProcedure
  .input(
    vacancyWorkspaceInputSchema.merge(
      z.object({ settings: updateVacancySettingsSchema }),
    ),
  )
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const existingVacancy = ensureFound(
      await context.db.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      }),
      "Вакансия не найдена",
    );

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

    const updatedVacancy = ensureFound(result[0], "Вакансия не найдена");

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

    return updatedVacancy;
  });
