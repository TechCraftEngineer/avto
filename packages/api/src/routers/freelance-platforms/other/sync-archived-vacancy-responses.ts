import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

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
        message: "Вакансия не опубликована на HH.ru (HeadHunter)",
      });
    }

    if (!publication.externalId && !publication.url) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "У публикации нет внешнего идентификатора или ссылки для синхронизации",
      });
    }

    try {
      // Отправляем событие для запуска синхронизации в фоне
      await inngest.send({
        name: "vacancy/responses.sync-archived",
        data: {
          vacancyId: input.vacancyId,
          workspaceId: input.workspaceId,
        },
      });

      return {
        success: true,
        message: "Синхронизация откликов с архивной вакансии запущена в фоне",
        syncedResponses: 0,
        newResponses: 0,
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