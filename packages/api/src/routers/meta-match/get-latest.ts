import {
  candidate as candidateTable,
  metaMatchReport,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "@qbs-autonaim/db";
import { z } from "zod";
import {
  getMetaMatchStatus,
  getRiskFlags,
  getSummaryLabels,
} from "../../services/meta-match/evaluator";
import { protectedProcedure } from "../../trpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

const getLatestInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  candidateId: uuidv7Schema,
});

export const getLatest = protectedProcedure
  .input(getLatestInputSchema)
  .query(async ({ ctx, input }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const response = await ctx.db.query.response.findFirst({
      where: eq(responseTable.id, input.candidateId),
      columns: { id: true, entityId: true, globalCandidateId: true },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
      columns: { id: true, workspaceId: true },
    });

    if (!vacancyData || vacancyData.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    let birthDate: Date | null = null;
    if (response.globalCandidateId) {
      const globalCandidate = await ctx.db.query.candidate.findFirst({
        where: eq(candidateTable.id, response.globalCandidateId),
        columns: { birthDate: true },
      });
      birthDate = globalCandidate?.birthDate ?? null;
    }

    const report = await ctx.db.query.metaMatchReport.findFirst({
      where: eq(metaMatchReport.candidateId, response.id),
      orderBy: desc(metaMatchReport.createdAt),
    });

    // Логируем просмотр Meta-Match отчета
    if (report) {
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        workspaceId: input.workspaceId,
        action: "VIEW",
        resourceType: "CANDIDATE",
        resourceId: response.id,
        metadata: {
          feature: "meta_match",
          action: "report_view",
          algorithmVersion: report.algorithmVersion,
          reportId: report.id,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }

    return {
      status: getMetaMatchStatus(!!report, !!birthDate),
      birthDate,
      report: report
        ? {
            ...report,
            summaryLabels: getSummaryLabels(report.summaryMetrics),
            riskFlags: getRiskFlags(report.summaryMetrics),
          }
        : null,
    };
  });
