import { importMultipleVacancies } from "../../../parsers/hh";
import { importArchivedVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";
import { importArchivedSelectedEventSchema } from "./import-archived-selected.schema";

/**
 * Inngest функция для импорта выбранных архивных вакансий из HH.ru
 */
export const importSelectedArchivedVacanciesFunction = inngest.createFunction(
  {
    id: "import-selected-archived-vacancies",
    name: "Импорт выбранных архивных вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.archived-selected" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const parseResult = importArchivedSelectedEventSchema.safeParse(event.data);

    if (!parseResult.success) {
      console.error(
        "❌ Ошибка валидации данных события:",
        parseResult.error.format(),
      );
      throw new Error(
        `Некорректные данные события: ${parseResult.error.message}`,
      );
    }

    const {
      workspaceId,
      vacancyIds,
      vacancies: vacanciesData,
    } = parseResult.data;

    await publish(
      importArchivedVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт выбранных архивных вакансий",
        total: vacancyIds.length,
        processed: 0,
      }),
    );

    const result = await step.run(
      "import-selected-archived-vacancies",
      async () => {
        console.log(
          `🚀 Запуск импорта ${vacancyIds.length} выбранных архивных вакансий для workspace ${workspaceId}`,
        );

        let imported = 0;
        let updated = 0;
        let failed = 0;

        // Создаем мапу для быстрого доступа к данным вакансий
        const vacanciesMap = new Map(
          vacanciesData?.map((v) => [v.id, v]) || [],
        );

        // Создаем массив для отслеживания прогресса по каждой вакансии
        const vacancyProgress: Array<{
          id: string;
          title: string;
          region?: string;
          archivedAt?: string;
          status: "pending" | "success" | "failed";
        }> = vacancyIds.map((id) => {
          const vacancyData = vacanciesMap.get(id);
          return {
            id,
            title: vacancyData?.title || "",
            region: vacancyData?.region,
            archivedAt: vacancyData?.archivedAt,
            status: "pending",
          };
        });

        try {
          // Преобразуем vacancyIds в формат { url, date }
          const vacanciesForImport = vacancyIds
            .map((id) => {
              const vacancyData = vacanciesMap.get(id);
              if (!vacancyData) return null;

              // Формируем URL из externalId
              const url = `https://hh.ru/vacancy/${id}`;
              const date = vacancyData.archivedAt || new Date().toISOString();

              return { url, date };
            })
            .filter((v): v is { url: string; date: string } => v !== null);

          // Используем оптимизированную функцию пакетного импорта
          const importResult = await importMultipleVacancies(
            workspaceId,
            vacanciesForImport,
          );

          imported = importResult.imported;
          updated = importResult.updated;
          failed = importResult.failed;

          // Обновляем статусы вакансий
          for (let i = 0; i < vacancyProgress.length; i++) {
            const progressItem = vacancyProgress[i];
            if (!progressItem) continue;

            // Определяем статус на основе результатов
            if (i < imported + updated) {
              progressItem.status = "success";
            } else {
              progressItem.status = "failed";
            }
          }

          // Отправляем финальный прогресс
          await publish(
            importArchivedVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "completed",
              message: `Импорт завершен: ${imported} импортировано, ${updated} обновлено, ${failed} ошибок`,
              total: vacancyIds.length,
              processed: vacancyIds.length,
              failed,
              vacancies: vacancyProgress,
            }),
          );

          await publish(
            importArchivedVacanciesChannel(workspaceId).result({
              workspaceId,
              success: true,
              imported,
              updated,
              failed,
            }),
          );

          console.log(
            `✅ Импорт выбранных архивных вакансий для workspace ${workspaceId} завершён: ${imported} новых, ${updated} обновлено, ${failed} ошибок`,
          );

          return { success: true, workspaceId, imported, updated, failed };
        } catch (error) {
          console.error(
            `❌ Ошибка при импорте выбранных архивных вакансий для workspace ${workspaceId}:`,
            error,
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Не удалось импортировать вакансии";

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
              imported,
              updated,
              failed,
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
