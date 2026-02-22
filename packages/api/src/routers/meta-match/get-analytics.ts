import { and, count, eq, gte, lte, sql } from "@qbs-autonaim/db";
import { metaMatchReport, response, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

const getAnalyticsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const getAnalytics = protectedProcedure
  .input(getAnalyticsInputSchema)
  .query(async ({ ctx, input }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const dateFilter = [];
    if (input.dateFrom) {
      dateFilter.push(gte(metaMatchReport.createdAt, input.dateFrom));
    }
    if (input.dateTo) {
      dateFilter.push(lte(metaMatchReport.createdAt, input.dateTo));
    }

    // Общее количество отчетов
    const [totalReports] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .innerJoin(response, eq(metaMatchReport.candidateId, response.id))
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(and(eq(vacancy.workspaceId, input.workspaceId), ...dateFilter));

    // Количество отчетов с данными компании
    const [reportsWithCompany] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .innerJoin(response, eq(metaMatchReport.candidateId, response.id))
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(
        and(
          eq(vacancy.workspaceId, input.workspaceId),
          sql`${metaMatchReport.companyBirthDate} IS NOT NULL`,
          ...dateFilter,
        ),
      );

    // Количество отчетов с данными руководителя
    const [reportsWithManager] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .innerJoin(response, eq(metaMatchReport.candidateId, response.id))
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(
        and(
          eq(vacancy.workspaceId, input.workspaceId),
          sql`${metaMatchReport.managerBirthDate} IS NOT NULL`,
          ...dateFilter,
        ),
      );

    // Количество отчетов с данными команды
    const [reportsWithTeam] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .innerJoin(response, eq(metaMatchReport.candidateId, response.id))
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(
        and(
          eq(vacancy.workspaceId, input.workspaceId),
          sql`${metaMatchReport.teamData} IS NOT NULL`,
          ...dateFilter,
        ),
      );

    // Средние значения метрик
    const [avgMetrics] = await ctx.db
      .select({
        avgSynergy: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'synergy')::int)`,
        avgTemporalResonance: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'temporalResonance')::int)`,
        avgConflictRisk: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'conflictRisk')::int)`,
        avgMoneyFlow: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'moneyFlow')::int)`,
        avgCompanySynergy: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'companySynergy')::int)`,
        avgManagerSynergy: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'managerSynergy')::int)`,
        avgTeamBalance: sql<number>`avg((${metaMatchReport.summaryMetrics}->>'teamBalance')::int)`,
      })
      .from(metaMatchReport)
      .innerJoin(response, eq(metaMatchReport.candidateId, response.id))
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(and(eq(vacancy.workspaceId, input.workspaceId), ...dateFilter));

    return {
      totalReports: totalReports?.count ?? 0,
      reportsWithCompanyData: reportsWithCompany?.count ?? 0,
      reportsWithManagerData: reportsWithManager?.count ?? 0,
      reportsWithTeamData: reportsWithTeam?.count ?? 0,
      averageMetrics: {
        synergy: Math.round(avgMetrics?.avgSynergy ?? 0),
        temporalResonance: Math.round(avgMetrics?.avgTemporalResonance ?? 0),
        conflictRisk: Math.round(avgMetrics?.avgConflictRisk ?? 0),
        moneyFlow: Math.round(avgMetrics?.avgMoneyFlow ?? 0),
        companySynergy: avgMetrics?.avgCompanySynergy
          ? Math.round(avgMetrics.avgCompanySynergy)
          : null,
        managerSynergy: avgMetrics?.avgManagerSynergy
          ? Math.round(avgMetrics.avgManagerSynergy)
          : null,
        teamBalance: avgMetrics?.avgTeamBalance
          ? Math.round(avgMetrics.avgTeamBalance)
          : null,
      },
    };
  });
