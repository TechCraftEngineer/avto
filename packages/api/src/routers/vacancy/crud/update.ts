import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancySettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CommunicationChannelsAnalytics } from "../../../services/analytics/communication-channels";
import { protectedProcedure } from "../../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
      settings: updateVacancySettingsSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем, что вакансия существует и принадлежит workspace
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
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
    if (settings.source !== undefined) {
      patch.source = settings.source === null ? undefined : settings.source;
    }
    if (settings.externalId !== undefined) {
      patch.externalId =
        settings.externalId === null ? null : settings.externalId;
    }
    if (settings.url !== undefined) {
      // Преобразуем пустую строку в null
      patch.url =
        settings.url === null || settings.url === "" ? null : settings.url;
    }
    if (settings.customDomainId !== undefined) {
      // Преобразуем пустую строку в null
      patch.customDomainId =
        settings.customDomainId === null || settings.customDomainId === ""
          ? null
          : settings.customDomainId;
    }

    const result = await ctx.db
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Отслеживаем изменения настроек каналов общения
    if (settings.enabledCommunicationChannels) {
      try {
        const analytics = new CommunicationChannelsAnalytics(ctx.db);

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
                userId: ctx.session.user.id,
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
