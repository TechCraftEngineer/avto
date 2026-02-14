/**
 * Export Data Procedure
 *
 * Экспортирует данные аналитики в CSV или JSON формате.
 * Защищённая процедура - требует авторизации.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AnalyticsError, AnalyticsExporter } from "../../services/analytics";
import { protectedProcedure } from "../../trpc";

const exportDataInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  format: z.enum(["csv", "json"]),
  vacancyId: z.uuid().optional(),
});

export const exportData = protectedProcedure
  .input(exportDataInputSchema)
  .mutation(async ({ ctx, input }) => {
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

    const analyticsExporter = new AnalyticsExporter(ctx.db);

    try {
      const exportResult = await analyticsExporter.exportData({
        workspaceId: input.workspaceId,
        period: input.period,
        format: input.format,
        vacancyId: input.vacancyId,
      });

      // Log audit event
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        action: "VIEW",
        resourceType: "VACANCY", // Using existing enum value
        resourceId: input.workspaceId,
        metadata: {
          type: "analytics_export",
          workspaceId: input.workspaceId,
          format: input.format,
          periodFrom: input.period.from.toISOString(),
          periodTo: input.period.to.toISOString(),
          vacancyId: input.vacancyId,
        },
      });

      return exportResult;
    } catch (error) {
      if (error instanceof AnalyticsError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
