/**
 * Get Recommendations procedure для AI-рекрутера агента
 *
 * Получает рекомендации разных типов:
 * - Кандидатов (на основе правил)
 * - Действий (ожидающих)
 * - Pending approvals
 *
 * Requirements: 1.1, 1.2, 6.1, 6.2
 */

import { ORPCError } from "@orpc/server";
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
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { checkWorkspaceAccess } from "./middleware";

/**
 * Схема для получения рекомендаций по кандидату
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
 * Схема для получения pending approvals
 */
const getPendingApprovalsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

/**
 * Схема для получения undoable actions
 */
const getUndoableActionsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

/**
 * Get Candidate Recommendations procedure
 *
 * Применяет правила к кандидату и возвращает рекомендации
 */
export const getRecommendations = protectedProcedure
  .input(getCandidateRecommendationsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, candidateId, vacancyId, candidateData } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const ruleEngine = getRuleEngine();

    // Подготавливаем данные кандидата
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

    // Применяем правила
    const results: RuleApplicationResult[] = ruleEngine.applyRules(
      ruleData,
      workspaceId,
      vacancyId,
    );

    // Фильтруем только сработавшие правила
    const matchedRules = results.filter(
      (r: RuleApplicationResult) => r.matched,
    );

    // Формируем рекомендации
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
 * Возвращает список действий, ожидающих подтверждения
 */
export const getPendingApprovals = protectedProcedure
  .input(getPendingApprovalsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
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
 * Возвращает список действий, которые можно отменить
 */
export const getUndoableActions = protectedProcedure
  .input(getUndoableActionsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
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
 * Возвращает audit log для workspace
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

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const actionExecutor = getActionExecutor();
    const auditLog: AuditLogEntry[] = actionExecutor.getAuditLog(workspaceId);

    // Сортируем по времени (новые первыми) и применяем пагинацию
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
