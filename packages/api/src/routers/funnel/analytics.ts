import { and, eq, inArray } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { mapResponseToStage } from "./map-response-stage";

export const analytics = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
      columns: { id: true },
    });

    const workspaceVacancyIds = vacancies.map((v) => v.id);

    const vacancyIds = input.vacancyId
      ? workspaceVacancyIds.includes(input.vacancyId)
        ? [input.vacancyId]
        : []
      : workspaceVacancyIds;

    if (vacancyIds.length === 0) {
      return {
        totalCandidates: 0,
        newThisWeek: 0,
        inReview: 0,
        hired: 0,
        conversionRate: 0,
        byStage: {
          NEW: 0,
          REVIEW: 0,
          INTERVIEW: 0,
          OFFER: 0,
          HIRED: 0,
          REJECTED: 0,
        },
      };
    }

    const responses = await ctx.db.query.response.findMany({
      where: and(
        inArray(responseTable.entityId, vacancyIds),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newThisWeek = responses.filter((r) => r.createdAt >= weekAgo).length;

    // Используем единую функцию маппинга для подсчета
    const byStage = {
      NEW: 0,
      REVIEW: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };

    for (const response of responses) {
      const stage = mapResponseToStage(
        response.status,
        response.hrSelectionStatus,
      );
      byStage[stage as keyof typeof byStage]++;
    }

    const hired = byStage.HIRED;
    const total = responses.length;
    const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    return {
      totalCandidates: total,
      newThisWeek,
      inReview: byStage.REVIEW,
      hired,
      conversionRate,
      byStage,
    };
  });
