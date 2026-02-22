import { ORPCError } from "@orpc/client";
import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const syncArchivedVacancyResponsesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
});

export const syncArchivedVacancyResponses = protectedProcedure
  .input(syncArchivedVacancyResponsesInputSchema)
  .handler(async ({ input, context: ctx }) => {
    // Проверяем доступ к workspace
    const hasAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к workspace",
      });
    }

    // Получаем вакансию и проверяем её существование
    const vacancy = await context.db.query.vacancy.findFirst({
      where: (vacancy, { eq, and }) =>
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", {
        message: "Вакансия не найдена",
      });
    }

    // Получаем публикацию на HH.ru для этой вакансии
    const publication = await context.db.query.vacancyPublication.findFirst({
      where: (pub, { and, eq }) =>
        and(eq(pub.vacancyId, input.vacancyId), eq(pub.platform, "HH")),
    });

    if (!publication) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Вакансия не опубликована на HH.ru (HeadHunter)",
      });
    }

    if (!publication.externalId && !publication.url) {
      throw new ORPCError("BAD_REQUEST", {
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

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Ошибка при синхронизации откликов с архивной вакансии",
        cause: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    }
  });
