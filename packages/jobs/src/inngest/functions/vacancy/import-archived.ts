import { runHHParser } from "../../../parsers/hh";
import { importArchivedVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";

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
    const { workspaceId } = event.data;

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
        await runHHParser({
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
            imported: 0, // TODO: получить реальное количество из парсера
            updated: 0,
            failed: 0,
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
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
