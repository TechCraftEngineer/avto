import { ORPCError } from "@orpc/server";
import { getRateLimitStats } from "@qbs-autonaim/server-utils";
import { publicProcedure } from "../../orpc";

/**
 * Получить статистику rate limiting (только для dev)
 */
export const rateLimitStats = publicProcedure.handler(async () => {
  if (process.env.NODE_ENV === "production") {
    throw new ORPCError("FORBIDDEN", {
      message: "Доступно только в dev режиме",
    });
  }

  const stats = getRateLimitStats();

  return {
    ...stats,
    message: `Активных записей: ${stats.activeRecords}, Истекших: ${stats.expiredRecords}`,
  };
});
