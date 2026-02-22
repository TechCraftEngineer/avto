/**
 * Get Recommendations procedure ��� AI-���������� ���������
 *
 * �������� ������������ ������ ���:
 * - ���������� (�� ������ ������)
 * - �������� (���������)
 * - Pending approvals
 *
 * Requirements: 1.1, 1.2, 6.1, 6.2
 */

import {
  type AuditLogEntry,
  type CandidateRuleData,
  type ExecutedActionRecord,
  getActionExecutor,
  getRuleEngine,
  type PendingApproval,
  type RuleApplicationResult,
} from "@qbs-autonaim/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { checkWorkspaceAccess } from "./middleware";

/**
 * ����� ��� ��������� ������������ �� ���������
 */
const getCandidateRecommendationsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  candidateId: z.uuid(),
  vacancyId: z.uuid().optional(),
  candidateData: z.object({
    fitScore: z.number().min(0).max(100),
    resumeScore: z.number().min(0).max(100),
    interviewScore: z.number().min(0).max(100).optional(),
    salaryExpectation: z.number().optional(),
    experience: z.number().optional(),
    availability: z
      .enum(["immediate", "2_weeks", "1_month", "unknown"])
      .optional(),
    skills: z.array(z.string()).optional(),
  }),
});

/**
 * ����� ��� ��������� pending approvals
 */
const getPendingApprovalsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

/**
 * ����� ��� ��������� undoable actions
 */
const getUndoableActionsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

/**
 * Get Candidate Recommendations procedure
 *
 * ��������� ������� � ��������� � ���������� ������������
 */
export const getRecommendations = protectedProcedure
  .input(getCandidateRecommendationsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, candidateId, vacancyId, candidateData } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    const ruleEngine = getRuleEngine();

    // ����������� ������ ���������
    const ruleData: CandidateRuleData = {
      id: candidateId,
      fitScore: candidateData.fitScore,
      resumeScore: candidateData.resumeScore,
      interviewScore: candidateData.interviewScore,
      salaryExpectation: candidateData.salaryExpectation,
      experience: candidateData.experience,
      availability: candidateData.availability,
      skills: candidateData.skills,
    };

    // ��������� �������
    const results: RuleApplicationResult[] = ruleEngine.applyRules(
      ruleData,
      workspaceId,
      vacancyId,
    );

    // ��������� ������ ����������� �������
    const matchedRules = results.filter(
      (r: RuleApplicationResult) => r.matched,
    );

    // ��������� ������������
    const recommendations = matchedRules.map(
      (result: RuleApplicationResult) => ({
        ruleId: result.ruleId,
        ruleName: result.ruleName,
        action: result.action,
        autonomyLevel: result.autonomyLevel,
        explanation: result.explanation,
        timestamp: result.timestamp,
      }),
    );

    return {
      candidateId,
      vacancyId,
      recommendations,
      totalRulesChecked: results.length,
      matchedRulesCount: matchedRules.length,
    };
  });

/**
 * Get Pending Approvals procedure
 *
 * ���������� ������ ��������, ��������� �������������
 */
export const getPendingApprovals = protectedProcedure
  .input(getPendingApprovalsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    const actionExecutor = getActionExecutor();
    const pendingApprovals: PendingApproval[] =
      actionExecutor.getPendingApprovals(workspaceId);

    return {
      approvals: pendingApprovals.map((approval: PendingApproval) => ({
        id: approval.id,
        ruleId: approval.ruleId,
        ruleName: approval.ruleName,
        candidateId: approval.candidateId,
        action: approval.action,
        explanation: approval.explanation,
        createdAt: approval.createdAt,
        expiresAt: approval.expiresAt,
        status: approval.status,
      })),
      total: pendingApprovals.length,
    };
  });

/**
 * Get Undoable Actions procedure
 *
 * ���������� ������ ��������, ������� ����� ��������
 */
export const getUndoableActions = protectedProcedure
  .input(getUndoableActionsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    const actionExecutor = getActionExecutor();
    const undoableActions: ExecutedActionRecord[] =
      actionExecutor.getUndoableActions(workspaceId);

    return {
      actions: undoableActions.map((action: ExecutedActionRecord) => ({
        id: action.id,
        ruleId: action.ruleId,
        ruleName: action.ruleName,
        candidateId: action.candidateId,
        vacancyId: action.vacancyId,
        actionType: action.action.type,
        status: action.status,
        explanation: action.explanation,
        timestamp: action.timestamp,
        undoDeadline: action.undoDeadline,
        timeRemaining: actionExecutor.getUndoTimeRemaining(action.id),
      })),
      total: undoableActions.length,
    };
  });

/**
 * Get Audit Log procedure
 *
 * ���������� audit log ��� workspace
 */
export const getAuditLog = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    const { workspaceId, limit, offset } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    const actionExecutor = getActionExecutor();
    const auditLog: AuditLogEntry[] = actionExecutor.getAuditLog(workspaceId);

    // ��������� �� ������� (����� �������) � ��������� ���������
    const sortedLog = auditLog
      .sort(
        (a: AuditLogEntry, b: AuditLogEntry) =>
          b.timestamp.getTime() - a.timestamp.getTime(),
      )
      .slice(offset, offset + limit);

    return {
      entries: sortedLog,
      total: auditLog.length,
      limit,
      offset,
    };
  });
