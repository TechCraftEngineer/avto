import { desc, eq } from "@qbs-autonaim/db";
import {
  globalCandidate,
  metaMatchReport,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  getMetaMatchStatus,
  getRiskFlags,
  getSummaryLabels,
} from "../../services/meta-match/evaluator";
import { protectedProcedure } from "../../orpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

const getLatestInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  candidateId: uuidv7Schema,
});

export const getLatest = protectedProcedure
  .input(getLatestInputSchema)
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const response = await context.db.query.response.findFirst({
      where: eq(responseTable.id, input.candidateId),
      columns: { id: true, entityId: true, globalCandidateId: true },
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден", });
    }

    const vacancyData = await context.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
      columns: { id: true, workspaceId: true },
    });

    if (!vacancyData || vacancyData.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому кандидату", });
    }

    let birthDate: Date | null = null;
    if (response.globalCandidateId) {
      const gc = await context.db.query.globalCandidate.findFirst({
        where: eq(globalCandidate.id, response.globalCandidateId),
        columns: { birthDate: true },
      });
      birthDate = gc?.birthDate ?? null;
    }

    const report = await context.db.query.metaMatchReport.findFirst({
      where: eq(metaMatchReport.candidateId, response.id),
      orderBy: desc(metaMatchReport.createdAt),
    });

    // Prefer report's birthDate if available
    if (report?.birthDate) {
      birthDate = report.birthDate;
    }

    // Логируем просмотр Meta-Match отчета
    if (report) {
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
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
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
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
