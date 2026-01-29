import { runHHParser } from "../../../parsers/hh";
import { importNewVacanciesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для импорта новых вакансий из HH.ru
 * Парсит все активные вакансии работодателя
 */
export const importNewVacanciesFunction = inngest.createFunction(
  {
    id: "import-new-vacancies",
    name: "Импорт новых вакансий",
    retries: 0,
    concurrency: 1,
  },
  { event: "vacancy/import.new" },
  async ({ event, step, publish }) => {
    const { workspaceId } = event.data;

    await publish(
      importNewVacanciesChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт активных вакансий",
      }),
    );

    const result = await step.run("import-new-vacancies", async () => {
      console.log(
        `🚀 Запуск импорта новых вакансий для workspace ${workspaceId}`,
      );

      try {
        await publish(
          importNewVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "processing",
            message: "Получаем вакансии с HeadHunter",
          }),
        );

        // Запускаем парсер HH для получения активных вакансий
        await runHHParser({
          workspaceId,
          skipResponses: true,
          includeArchived: false,
        });

        await publish(
          importNewVacanciesChannel(workspaceId).progress({
            workspaceId,
            status: "completed",
            message: "Импорт завершён",
          }),
        );

        await publish(
          importNewVacanciesChannel(workspaceId).result({
            workspaceId,
            success: true,
            imported: 0, // TODO: получить реальное количество из парсера
            updated: 0,
            failed: 0,
          }),
        );

        console.log(
          `✅ Импорт новых вакансий для workspace ${workspaceId} завершён`,
        );

        return { success: true, workspaceId };
      } catch (error) {
        console.error(
          `❌ Ошибка при импорте новых вакансий для workspace ${workspaceId}:`,
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
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
