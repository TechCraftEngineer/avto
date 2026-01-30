import { z } from "zod";
import { runHHParser } from "../../../parsers/hh";
import { importArchivedVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Схема валидации входных данных для импорта архивных вакансий
 */
const ImportArchivedVacanciesEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
});

/**
 * Inngest функция для импорта архивных вакансий из HH.ru
 * Парсит все закрытые вакансии работодателя
 */
export const importArchivedVacanciesFunction = inngest.createFunction(
  {
    id: "import-archived-vacancies",
    name: "Импорт архивных вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.archived" },
  async ({ event, step, publish }) => {
    // Валидация входных данных
    const validationResult = ImportArchivedVacanciesEventSchema.safeParse(
      event.data,
    );

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      console.error("❌ Ошибка валидации входных данных:", errorMessage);
      throw new Error(errorMessage);
    }

    const { workspaceId } = validationResult.data;

    await publish(
      importArchivedVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт архивных вакансий",
      }),
    );

    const result = await step.run("import-archived-vacancies", async () => {
      console.log(
        `🚀 Запуск импорта архивных вакансий для workspace ${workspaceId}`,
      );

      try {
        await publish(
          importArchivedVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "processing",
            message: "Получаем архивные вакансии с HeadHunter",
          }),
        );

        // Запускаем парсер HH для получения архивных вакансий
        const parserResult = await runHHParser({
          workspaceId,
          skipResponses: true,
          includeArchived: true,
        });

        await publish(
          importArchivedVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "completed",
            message: "Импорт завершён",
          }),
        );

        await publish(
          importArchivedVacanciesChannel(workspaceId).result({
            workspaceId,
            success: true,
            imported: parserResult.imported,
            updated: parserResult.updated,
            failed: parserResult.failed,
          }),
        );

        console.log(
          `✅ Импорт архивных вакансий для workspace ${workspaceId} завершён`,
        );

        return { success: true, workspaceId };
      } catch (error) {
        console.error(
          `❌ Ошибка при импорте архивных вакансий для workspace ${workspaceId}:`,
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
    });

    return result;
  },
);
