import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { eq } from "@qbs-autonaim/db";
import { vacancyPublication } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { runHHArchivedVacancyParser } from "../../../jobs/src/parsers/hh/archived-runner";

const syncArchivedVacancyResponsesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
});

export const syncArchivedVacancyResponses = protectedProcedure
  .input(syncArchivedVacancyResponsesInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Получаем вакансию и проверяем её существование
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq, and }) =>
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем публикацию на HH.ru для этой вакансии
    const publication = await ctx.db.query.vacancyPublication.findFirst({
      where: (pub, { and, eq }) =>
        and(
          eq(pub.vacancyId, input.vacancyId),
          eq(pub.platform, "HH"),
          eq(pub.isActive, true),
        ),
    });

    if (!publication) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вакансия не опубликована на HH.ru",
      });
    }

    if (!publication.externalId && !publication.url) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "У публикации нет externalId или URL для синхронизации",
      });
    }

    try {
      // Запускаем парсер для архивной вакансии
      const result = await runHHArchivedVacancyParser({
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        externalId: publication.externalId,
        url: publication.url,
      });

      // Обновляем lastSyncedAt для публикации
      await ctx.db
        .update(vacancyPublication)
        .set({
          lastSyncedAt: new Date(),
        })
        .where(eq(vacancyPublication.id, publication.id));

      return {
        success: true,
        message: "Синхронизация откликов с архивной вакансии запущена",
        syncedResponses: result.syncedResponses,
        newResponses: result.newResponses,
        platform: "HH",
        vacancyTitle: vacancy.title,
      };
    } catch (error) {
      console.error("Ошибка синхронизации архивных откликов:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при синхронизации откликов с архивной вакансии",
        cause: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    }
  });