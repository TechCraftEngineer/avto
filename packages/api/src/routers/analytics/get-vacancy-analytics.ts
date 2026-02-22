/**
 * Get Vacancy Analytics Procedure
 *
 * Получает аналитику по конкретной вакансии.
 * Защищённая процедура - требует авторизации.
 */

import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { AnalyticsAggregator, AnalyticsError } from "../../services/analytics";

const getVacancyAnalyticsInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  vacancyId: z.uuid("Некорректный ID вакансии"),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
});

export const getVacancyAnalytics = protectedProcedure
  .input(getVacancyAnalyticsInputSchema)
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
      const vacancyAnalytics = await analyticsAggregator.getVacancyAnalytics({
        vacancyId: input.vacancyId,
        workspaceId: input.workspaceId,
        period: input.period,
      });

      return vacancyAnalytics;
    } catch (error) {
      if (error instanceof AnalyticsError) {
        if (error.code === "VACANCY_NOT_FOUND") {
          throw new ORPCError("NOT_FOUND", { message: error.userMessage, cause: error,
          });
        }
        throw new ORPCError("BAD_REQUEST", { message: error.userMessage, cause: error,
        });
      }
      throw error;
    }
  });
