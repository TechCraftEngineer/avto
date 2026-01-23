import {
  candidate as candidateTable,
  metaMatchReport,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { evaluateMetaMatch } from "../../services/meta-match/evaluator";
import { protectedProcedure } from "../../trpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

const evaluateCandidateInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  candidateId: uuidv7Schema,
  birthDate: z.coerce.date().optional(),
  companyBirthDate: z.coerce.date().optional(),
  managerBirthDate: z.coerce.date().optional(),
  teamData: z
    .array(
      z.object({
        coreIndex: z.number().int().min(1).max(9),
        stabilityIndex: z.number().int().min(1).max(9),
        changeIndex: z.number().int().min(1).max(9),
        phase: z.enum(["stabilization", "growth", "change"]),
      }),
    )
    .optional(),
  consentGranted: z.boolean(),
  requestedBy: z.string().min(1).optional(),
});

export const evaluateCandidate = protectedProcedure
  .input(evaluateCandidateInputSchema)
  .mutation(async ({ ctx, input }) => {
    if (!input.consentGranted) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Нет согласия кандидата на обработку даты рождения",
      });
    }

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

    let resolvedBirthDate = input.birthDate ?? null;
    if (!resolvedBirthDate && response.globalCandidateId) {
      const globalCandidate = await ctx.db.query.candidate.findFirst({
        where: eq(candidateTable.id, response.globalCandidateId),
        columns: { birthDate: true },
      });
      resolvedBirthDate = globalCandidate?.birthDate ?? null;
    }

    if (!resolvedBirthDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Дата рождения не указана",
      });
    }

    const evaluation = evaluateMetaMatch(resolvedBirthDate, new Date(), {
      companyBirthDate: input.companyBirthDate,
      managerBirthDate: input.managerBirthDate,
      teamData: input.teamData,
    });
    const requestedBy = input.requestedBy ?? ctx.session.user.id;

    const [report] = await ctx.db
      .insert(metaMatchReport)
      .values({
        candidateId: response.id,
        birthDate: resolvedBirthDate,
        companyBirthDate: input.companyBirthDate,
        managerBirthDate: input.managerBirthDate,
        teamData: evaluation.teamData,
        summaryMetrics: evaluation.summaryMetrics,
        narrative: evaluation.narrative,
        recommendations: evaluation.recommendations,
        disclaimer: evaluation.disclaimer,
        algorithmVersion: evaluation.algorithmVersion,
        consentGranted: input.consentGranted,
        requestedBy,
      })
      .returning();

    if (!report) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отчет о мета-матче",
      });
    }

    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      workspaceId: input.workspaceId,
      action: "EVALUATE",
      resourceType: "CANDIDATE",
      resourceId: response.id,
      metadata: {
        feature: "meta_match",
        consentGranted: input.consentGranted,
        algorithmVersion: evaluation.algorithmVersion,
        reportId: report.id,
        hasCompanyData: !!input.companyBirthDate,
        hasManagerData: !!input.managerBirthDate,
        hasTeamData: !!(input.teamData && input.teamData.length > 0),
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      status: "ready" as const,
      report: {
        ...report,
        summaryLabels: evaluation.summaryLabels,
        riskFlags: evaluation.riskFlags,
      },
    };
  });
