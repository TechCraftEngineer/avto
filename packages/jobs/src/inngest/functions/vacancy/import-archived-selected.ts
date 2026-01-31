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

    const { workspaceId, vacancyIds } = parseResult.data;

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

        // Создаем массив для отслеживания прогресса по каждой вакансии
        const vacancyProgress = vacancyIds.map((id) => ({
          id,
          title: "", // Будет заполнено при обработке
          status: "pending" as const,
        }));

        try {
          // Используем оптимизированную функцию пакетного импорта
          // Она переиспользует один браузер и сеанс аутентификации для всех вакансий
          const results = await importMultipleVacancies(
            workspaceId,
            vacancyIds,
          );

          // Обрабатываем результаты и отправляем прогресс батчами
          const BATCH_SIZE = 5; // Отправляем обновление каждые 5 вакансий

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result) continue;

            // Обновляем прогресс текущей вакансии
            const currentVacancyId = vacancyIds[i];
            if (!currentVacancyId) continue;

            vacancyProgress[i] = {
              id: currentVacancyId,
              title: result.title || `Вакансия ${currentVacancyId}`,
              status: "processing",
            };

            // Отправляем прогресс с текущей вакансией
            await publish(
              importArchivedVacanciesChannel(workspaceId).progress({
                workspaceId,
                status: "processing",
                message: `Обрабатывается: ${result.title || currentVacancyId}`,
                total: vacancyIds.length,
                processed: i,
                failed,
                currentVacancy: {
                  id: currentVacancyId,
                  title: result.title || `Вакансия ${currentVacancyId}`,
                },
                vacancies: [...vacancyProgress],
              }),
            );

            if (result.success) {
              if (result.isNew) {
                imported++;
              } else {
                updated++;
              }
              const progressItem = vacancyProgress[i];
              if (progressItem) {
                progressItem.status = "success";
              }
            } else {
              failed++;
              const progressItem = vacancyProgress[i];
              if (progressItem) {
                progressItem.status = "failed";
              }
            }

            // Отправляем прогресс только для батчей или последней вакансии
            const isLastItem = i === results.length - 1;
            const isBatchBoundary = (i + 1) % BATCH_SIZE === 0;

            if (isBatchBoundary || isLastItem) {
              await publish(
                importArchivedVacanciesChannel(workspaceId).progress({
                  workspaceId,
                  status: "processing",
                  message: `Обработано ${i + 1} из ${vacancyIds.length}`,
                  total: vacancyIds.length,
                  processed: i + 1,
                  failed,
                  vacancies: [...vacancyProgress],
                }),
              );
            }
          }

          await publish(
            importArchivedVacanciesChannel(workspaceId).progress({
              workspaceId,
              status: "completed",
              message: "Импорт завершён",
              total: vacancyIds.length,
              processed: vacancyIds.length,
              vacancies: [...vacancyProgress],
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
