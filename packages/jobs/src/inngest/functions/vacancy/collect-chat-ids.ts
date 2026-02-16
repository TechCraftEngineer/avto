import { collectChatIdsForVacancy } from "../../../services/collect-chat-ids";
import { inngest } from "../../client";

/**
 * Inngest функция для сбора chat_id для всех откликов вакансии
 */
export const collectChatIdsFunction = inngest.createFunction(
  {
    id: "collect-chat-ids",
    name: "Collect Chat IDs for Vacancy Responses",
    retries: 2,
  },
  { event: "vacancy/chat-ids.collect" },
  async ({ event, step }) => {
    const { vacancyId } = event.data;

    const result = await step.run("collect-chat-ids", async () => {
      console.log(`🚀 Начинаем сбор chat_id для вакансии ${vacancyId}`);

      const { success, updatedCount } = await collectChatIdsForVacancy(
        vacancyId,
        { silent: false },
      );

      console.log(
        `✅ Сбор chat_id завершен. Обновлено откликов: ${updatedCount}`,
      );

      return { success, updatedCount };
    });

    return result;
  },
);
