import { metaMatchReport } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { and, count, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
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
      dateFilter.push(gte(metaMatchReport.createdAt, input.dateTo));
    }

    // Общее количество отчетов
    const [totalReports] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .where(and(...dateFilter));

    // Количество отчетов с данными компании
    const [reportsWithCompany] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .where(and(sql`${metaMatchReport.companyBirthDate} IS NOT NULL`, ...dateFilter));

    // Количество отчетов с данными руководителя
    const [reportsWithManager] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .where(and(sql`${metaMatchReport.managerBirthDate} IS NOT NULL`, ...dateFilter));

    // Количество отчетов с данными команды
    const [reportsWithTeam] = await ctx.db
      .select({ count: count() })
      .from(metaMatchReport)
      .where(and(sql`${metaMatchReport.teamData} IS NOT NULL`, ...dateFilter));

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
      .where(and(...dateFilter));

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
        companySynergy: avgMetrics?.avgCompanySynergy ? Math.round(avgMetrics.avgCompanySynergy) : null,
        managerSynergy: avgMetrics?.avgManagerSynergy ? Math.round(avgMetrics.avgManagerSynergy) : null,
        teamBalance: avgMetrics?.avgTeamBalance ? Math.round(avgMetrics.avgTeamBalance) : null,
      },
    };
  });