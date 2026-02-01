import { runHHParser } from "@qbs-autonaim/jobs-parsers";
import { inngest } from "../../client";

/**
 * Inngest function for updating active vacancies
 * Parses vacancies from HH.ru but skips response parsing
 */
export const updateVacanciesFunction = inngest.createFunction(
  {
    id: "update-vacancies",
    name: "Update Active Vacancies",
    retries: 0,
    concurrency: 1, // Ensure only one parser runs at a time to avoid conflicts
  },
  { event: "vacancy/update.active" },
  async ({ event, step }) => {
    return await step.run("parse-vacancies", async () => {
      console.log("🚀 Запуск обновления вакансий через Inngest");

      try {
        await runHHParser({
          skipResponses: true,
          workspaceId: event.data.workspaceId,
        });
        console.log("✅ Обновление вакансий завершено успешно");
        return { success: true };
      } catch (error) {
        console.error("❌ Ошибка при обновлении вакансий:", error);
        throw error;
      }
    });
  },
);
