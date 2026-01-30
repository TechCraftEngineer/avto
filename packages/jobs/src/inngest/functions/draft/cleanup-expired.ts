import { DraftRepository, db } from "@qbs-autonaim/db";
import { inngest } from "../../client";

/**
 * Inngest функция для фоновой очистки устаревших черновиков
 * Удаляет черновики старше 7 дней
 *
 * Требования: 2.5, 5.3
 */
export const cleanupExpiredDraftsFunction = inngest.createFunction(
  {
    id: "cleanup-expired-drafts",
    name: "Очистка устаревших черновиков",
    retries: 3,
  },
  { cron: "0 2 * * *" }, // Запуск каждый день в 2:00 ночи
  async ({ step }) => {
    return await step.run("cleanup-drafts", async () => {
      console.log("🧹 Запуск очистки устаревших черновиков");

      try {
        const repo = new DraftRepository(db);

        // Удалить черновики старше 7 дней
        const deletedCount = await repo.deleteExpired(7);

        console.log(
          `✅ Очистка завершена. Удалено черновиков: ${deletedCount}`,
        );

        return {
          success: true,
          deletedCount,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("❌ Ошибка при очистке черновиков:", error);
        throw error;
      }
    });
  },
);
