import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { importMultipleVacancies } from "@qbs-autonaim/jobs-parsers";
import { z } from "zod";
import {
  importNewVacanciesChannel,
  workspaceNotificationsChannel,
  workspaceStatsChannel,
} from "../../channels/client";
import { isHHAuthError } from "../../../utils/hh-auth-error";
import { inngest } from "../../client";
import { pluralizeVacancy } from "./pluralize-vacancy";

/**
 * Схема валидации входных данных для импорта выбранных активных вакансий
 */
const ImportNewSelectedEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancyIds: z
    .array(z.string())
    .min(1, "Необходимо выбрать хотя бы одну вакансию"),
  vacancies: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().url(),
        region: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Inngest функция для импорта выбранных активных вакансий из HH.ru
 * Парсит только указанные вакансии с детальным прогрессом
 */
export const importSelectedNewVacanciesFunction = inngest.createFunction(
  {
    id: "import-new-selected-vacancies",
    name: "Импорт выбранных активных вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.new-selected" },
  async ({ event, step, publish, runId }) => {
    const validationResult = ImportNewSelectedEventSchema.safeParse(
      event.data,
    );

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId, vacancyIds, vacancies } = validationResult.data;

    const vacancyList =
      vacancies && vacancies.length > 0
        ? vacancies
        : vacancyIds.map((id) => ({
        id,
        title: `Вакансия ${id}`,
        url: `https://hh.ru/vacancy/${id}`,
        region: undefined,
      }));

    await publish(
      importNewVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт выбранных активных вакансий",
        total: vacancyList.length,
        processed: 0,
      }),
    );

    const result = await step.run(
      "import-new-selected-vacancies",
      async () => {
        console.log(
          `🚀 Запуск импорта ${vacancyList.length} выбранных активных вакансий для workspace ${workspaceId}`,
        );

        try {
          let failed = 0;

          const vacanciesWithUrls = vacancyList.map((v) => ({
            url: v.url,
            region: v.region,
          }));

          const vacanciesWithProgress = await importMultipleVacancies(
            workspaceId,
            vacanciesWithUrls,
            async (index: number, success: boolean, _error?: string) => {
              if (!success) failed++;

              await publish(
                importNewVacanciesChannel(workspaceId).progress({
                  workspaceId,
                  status: "processing",
                  message: `Обработано ${index + 1} из ${vacancyList.length} ${pluralizeVacancy(vacancyList.length)}`,
                  total: vacancyList.length,
                  processed: index + 1,
                  failed,
                }),
              );
            },
            { isArchived: false },
          );

          await publish(
            importNewVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "completed",
              message: "Импорт завершён",
              total: vacancyList.length,
              processed: vacancyList.length,
              failed,
            }),
          );

          await publish(
            importNewVacanciesChannel(workspaceId).result({
              workspaceId,
              success: true,
              imported: vacanciesWithProgress.imported,
              updated: vacanciesWithProgress.updated,
              failed: vacanciesWithProgress.failed,
            }),
          );

          await publish(
            workspaceNotificationsChannel(workspaceId)["task-completed"]({
              workspaceId,
              taskType: "import",
              taskId: runId,
              success: true,
              message: `Импортировано ${vacanciesWithProgress.imported} выбранных вакансий`,
              timestamp: new Date().toISOString(),
            }),
          );

          if (
            vacanciesWithProgress.imported > 0 ||
            vacanciesWithProgress.updated > 0
          ) {
            const [totalCountResult, activeCountResult] = await Promise.all([
              db.$count(vacancy, eq(vacancy.workspaceId, workspaceId)),
              db.$count(
                vacancy,
                and(
                  eq(vacancy.workspaceId, workspaceId),
                  eq(vacancy.isActive, true),
                ),
              ),
            ]);

            await publish(
              workspaceStatsChannel(workspaceId)["vacancies-updated"]({
                workspaceId,
                totalVacancies: totalCountResult,
                activeVacancies: activeCountResult,
                updatedAt: new Date().toISOString(),
              }),
            );
          }

          console.log(
            `✅ Импорт выбранных активных вакансий для workspace ${workspaceId} завершён`,
          );

          return { success: true, workspaceId };
        } catch (error) {
          console.error(
            `❌ Ошибка при импорте выбранных активных вакансий для workspace ${workspaceId}:`,
            error,
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Не удалось подключиться к источнику вакансий";

          await publish(
            importNewVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "error",
              message: errorMessage,
            }),
          );

          await publish(
            importNewVacanciesChannel(workspaceId).result({
              workspaceId,
              success: false,
              imported: 0,
              updated: 0,
              failed: 0,
              error: errorMessage,
            }),
          );

          if (isHHAuthError(error)) {
            await publish(
              workspaceNotificationsChannel(workspaceId)["integration-error"]({
                workspaceId,
                type: "hh-auth-failed",
                message:
                  "Авторизация в HeadHunter слетела. Проверьте учётные данные в настройках интеграции.",
                severity: "error",
                timestamp: new Date().toISOString(),
              }),
            );
          }

          throw error;
        }
      },
    );

    return result;
  },
);
