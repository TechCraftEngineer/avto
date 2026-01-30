import { DraftRepository, db } from "@qbs-autonaim/db";
import { inngest } from "../../client";

// Константа для настройки периода хранения черновиков
const EXPIRED_DAYS = 7;

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
  { cron: "TZ=Europe/Moscow 0 2 * * *" }, // Запуск каждый день в 2:00 ночи по московскому времени
  async ({ step }) => {
    return await step.run("cleanup-drafts", async () => {
      console.log("🧹 Запуск очистки устаревших черновиков");

      try {
        const repo = new DraftRepository(db);

        // Удалить черновики старше EXPIRED_DAYS дней
        const deletedCount = await repo.deleteExpired(EXPIRED_DAYS);

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
