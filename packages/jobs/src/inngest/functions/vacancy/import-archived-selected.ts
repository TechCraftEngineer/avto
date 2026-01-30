import { importMultipleVacancies } from "../../../parsers/hh";
import { importArchivedVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";

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
    const { workspaceId, vacancyIds } = event.data;

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

        try {
          // Используем оптимизированную функцию пакетного импорта
          // Она переиспользует один браузер и сеанс аутентификации для всех вакансий
          const results = await importMultipleVacancies(
            workspaceId,
            vacancyIds,
          );

          // Обрабатываем результаты и отправляем прогресс
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result) continue;

            if (result.success) {
              if (result.isNew) {
                imported++;
              } else {
                updated++;
              }
            } else {
              failed++;
            }

            // Отправляем прогресс после каждой обработанной вакансии
            await publish(
              importArchivedVacanciesChannel(workspaceId).progress({
                workspaceId,
                status: "processing",
                message: `Обработано ${i + 1} из ${vacancyIds.length}`,
                total: vacancyIds.length,
                processed: i + 1,
              }),
            );

            // Небольшая задержка для отображения прогресса
            if (i < results.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          await publish(
            importArchivedVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "completed",
              message: "Импорт завершён",
              total: vacancyIds.length,
              processed: vacancyIds.length,
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
