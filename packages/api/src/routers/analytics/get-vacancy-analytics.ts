/**
 * Get Vacancy Analytics Procedure
 *
 * Получает аналитику по конкретной вакансии.
 * Защищённая процедура - требует авторизации.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AnalyticsAggregator, AnalyticsError } from "../../services/analytics";
import { protectedProcedure } from "../../trpc";

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
  .query(async ({ ctx, input }) => {
    // Verify user has access to workspace
    const membership = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const analyticsAggregator = new AnalyticsAggregator(ctx.db);

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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.userMessage,
            cause: error,
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
