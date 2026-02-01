import { z } from "zod";
import { importMultipleVacancies } from "../../../parsers/hh";
import {
  importArchivedVacanciesChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

/**
 * Схема валидации входных данных для импорта выбранных архивных вакансий
 */
const ImportArchivedSelectedEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancyIds: z
    .array(z.string())
    .min(1, "Необходимо выбрать хотя бы одну вакансию"),
  vacancies: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        region: z.string().optional(),
        archivedAt: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Inngest функция для импорта выбранных архивных вакансий из HH.ru
 * Парсит только указанные вакансии с детальным прогрессом
 */
export const importSelectedArchivedVacanciesFunction = inngest.createFunction(
  {
    id: "import-archived-selected-vacancies",
    name: "Импорт выбранных архивных вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.archived-selected" },
  async ({ event, step, publish, runId }) => {
    // Валидация входных данных
    const validationResult = ImportArchivedSelectedEventSchema.safeParse(
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

    // Если не передан массив vacancies, создаем базовый из vacancyIds
    const vacancyList =
      vacancies ||
      vacancyIds.map((id) => ({
        id,
        title: `Вакансия ${id}`,
        url: `https://hh.ru/vacancy/${id}`,
        region: undefined,
        archivedAt: undefined,
      }));

    // Инициализируем массив прогресса для всех вакансий
    const vacancyProgress: Array<{
      id: string;
      title: string;
      region?: string;
      workLocation?: string;
      archivedAt?: string;
      status: "pending" | "processing" | "success" | "failed";
      error?: string;
    }> = vacancyList.map((v) => ({
      id: v.id,
      title: v.title,
      region: v.region,
      archivedAt: v.archivedAt,
      status: "pending",
    }));

    await publish(
      importArchivedVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт выбранных архивных вакансий",
        total: vacancyList.length,
        processed: 0,
        vacancies: vacancyProgress,
      }),
    );

    const result = await step.run(
      "import-archived-selected-vacancies",
      async () => {
        console.log(
          `🚀 Запуск импорта ${vacancyList.length} выбранных архивных вакансий для workspace ${workspaceId}`,
        );

        try {
          let failed = 0;

          // Формируем список вакансий для импорта с URL из данных
          const vacanciesWithUrls = vacancyList.map((v) => ({
            url: v.url,
            date: v.archivedAt || "",
          }));

          // Импортируем вакансии с прогрессом
          const vacanciesWithProgress = await importMultipleVacancies(
            workspaceId,
            vacanciesWithUrls,
            async (index, success, error) => {
              // Обновляем статус текущей вакансии
              const currentVacancy = vacancyList[index];
              if (!currentVacancy) return;

              vacancyProgress[index] = {
                id: currentVacancy.id,
                title: currentVacancy.title,
                region: currentVacancy.region,
                archivedAt: currentVacancy.archivedAt,
                status: success ? "success" : "failed",
                error,
              };

              if (!success) {
                failed++;
              }

              // Отправляем обновленный прогресс
              const nextVacancy = vacancyList[index + 1];
              await publish(
                importArchivedVacanciesChannel(workspaceId).progress({
                  workspaceId,
                  status: "processing",
                  message: `Обработано ${index + 1} из ${vacancyList.length} вакансий`,
                  total: vacancyList.length,
                  processed: index + 1,
                  failed,
                  currentVacancy: nextVacancy
                    ? {
                        id: nextVacancy.id,
                        title: nextVacancy.title,
                      }
                    : undefined,
                  vacancies: [...vacancyProgress],
                }),
              );
            },
          );

          await publish(
            importArchivedVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "completed",
              message: "Импорт завершён",
              total: vacancyList.length,
              processed: vacancyList.length,
              failed,
              vacancies: vacancyProgress,
            }),
          );

          await publish(
            importArchivedVacanciesChannel(workspaceId).result({
              workspaceId,
              success: true,
              imported: vacanciesWithProgress.imported,
              updated: vacanciesWithProgress.updated,
              failed: vacanciesWithProgress.failed,
            }),
          );

          // Отправляем уведомление о завершении
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

          console.log(
            `✅ Импорт выбранных архивных вакансий для workspace ${workspaceId} завершён`,
          );

          return { success: true, workspaceId };
        } catch (error) {
          console.error(
            `❌ Ошибка при импорте выбранных архивных вакансий для workspace ${workspaceId}:`,
            error,
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Не удалось подключиться к источнику вакансий";

          await publish(
            importArchivedVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "error",
              message: errorMessage,
            }),
          );

          await publish(
            importArchivedVacanciesChannel(workspaceId).result({
              workspaceId,
              success: false,
              imported: 0,
              updated: 0,
              failed: 0,
              error: errorMessage,
            }),
          );

          throw error;
        }
      },
    );

    return result;
  },
);
