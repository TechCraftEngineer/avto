/**
 * Get Dashboard Procedure
 *
 * Получает данные дашборда аналитики для workspace.
 * Защищённая процедура - требует авторизации.
 */

import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { AnalyticsAggregator, AnalyticsError } from "../../services/analytics";

const getDashboardInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  granularity: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const getDashboard = protectedProcedure
  .input(getDashboardInputSchema)
  .handler(async ({ context, input }) => {
    // Verify user has access to workspace
    const membership = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!membership) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace",
      });
    }

    const analyticsAggregator = new AnalyticsAggregator(context.db);

    try {
      const dashboard = await analyticsAggregator.getDashboard({
        workspaceId: input.workspaceId,
        period: input.period,
        granularity: input.granularity,
      });

      return dashboard;
    } catch (error) {
      if (error instanceof AnalyticsError) {
        throw new ORPCError("BAD_REQUEST", { message: error.userMessage, cause: error,
        });
      }
      throw error;
    }
  });
