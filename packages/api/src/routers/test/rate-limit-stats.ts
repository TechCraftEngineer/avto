import { getRateLimitStats } from "@qbs-autonaim/server-utils";
import { publicProcedure } from "../../trpc";

/**
 * Получить статистику rate limiting (только для dev)
 */
export const rateLimitStats = publicProcedure.query(async () => {
  if (process.env.NODE_ENV === "production") {
    return {
      error: "Доступно только в dev режиме",
    };
  }

  const stats = getRateLimitStats();

  return {
    ...stats,
    message: `Активных записей: ${stats.activeRecords}, Истекших: ${stats.expiredRecords}`,
  };
});
