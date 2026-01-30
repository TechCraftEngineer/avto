import { z } from "zod";
import { importSingleVacancy } from "../../../parsers/hh";
import { importArchivedVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Схема валидации входных данных для импорта выбранных архивных вакансий
 */
const ImportSelectedArchivedVacanciesEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancyIds: z
    .array(z.string())
    .min(1, "Необходимо выбрать хотя бы одну вакансию"),
});

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
    const validationResult =
      ImportSelectedArchivedVacanciesEventSchema.safeParse(event.data);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId, vacancyIds } = validationResult.data;

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
          // Импортируем каждую выбранную вакансию
          for (let i = 0; i < vacancyIds.length; i++) {
            const vacancyId = vacancyIds[i];
            if (!vacancyId) continue;

            try {
              await publish(
                importArchivedVacanciesChannel(workspaceId).progress({
                  workspaceId,
                  status: "processing",
                  message: `Импорт вакансии ${i + 1} из ${vacancyIds.length}`,
                  total: vacancyIds.length,
                  processed: i,
                }),
              );

              const { isNew } = await importSingleVacancy(
                workspaceId,
                vacancyId,
              );

              if (isNew) {
                imported++;
              } else {
                updated++;
              }

              console.log(
                `✅ Вакансия ${i + 1}/${vacancyIds.length} импортирована (${isNew ? "новая" : "обновлена"})`,
              );
            } catch (error) {
              failed++;
              console.error(
                `❌ Ошибка импорта вакансии ${vacancyId}:`,
                error instanceof Error ? error.message : String(error),
              );
            }

            // Небольшая задержка между вакансиями
            if (i < vacancyIds.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
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
