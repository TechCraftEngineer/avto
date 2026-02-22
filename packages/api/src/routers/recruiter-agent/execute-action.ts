/**
 * Execute Action procedure для AI-ассистента рекрутера
 *
 * Выполняет действия агента:
 * - Приглашение кандидата
 * - Отклонение кандидата
 * - Отправка сообщения
 * - Отмена действия
 *
 * Requirements: 1.1, 9.1, 9.4
 */

import { getActionExecutor, type RuleActionType } from "@qbs-autonaim/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import {
  checkActionPermission,
  checkRateLimit,
  checkWorkspaceAccess,
} from "./middleware";

/**
 * Схема типа действия
 */
const actionTypeSchema = z.enum([
  "invite",
  "clarify",
  "reject",
  "notify",
  "pause_vacancy",
  "tag",
]);

/**
 * Схема входных данных для executeAction
 */
const executeActionInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  actionType: actionTypeSchema,
  candidateId: z.uuid(),
  vacancyId: z.uuid().optional(),
  params: z
    .object({
      messageTemplate: z.string().optional(),
      notificationChannel: z.enum(["email", "telegram", "sms"]).optional(),
      tag: z.string().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

/**
 * Схема для отмены действия
 */
const undoActionInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  actionId: z.uuid(),
});

/**
 * Схема для подтверждения pending approval
 */
const approveActionInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  approvalId: z.uuid(),
});

/**
 * Execute Action procedure
 */
export const executeAction = protectedProcedure
  .input(executeActionInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, actionType, candidateId, vacancyId, params } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Проверка прав на действие
    const permissionMap: Record<
      RuleActionType,
      Parameters<typeof checkActionPermission>[3]
    > = {
      invite: "invite_candidate",
      clarify: "send_message",
      reject: "reject_candidate",
      notify: "send_message",
      pause_vacancy: "configure_rules",
      tag: "send_message",
    };

    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      permissionMap[actionType],
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "Нет прав на выполнение этого действия", });
    }

    // Проверка rate limiting (100 действий в час)
    const rateLimitKey = `actions:${workspaceId}`;
    const canProceed = await checkRateLimit(rateLimitKey, 100, 3600);

    if (!canProceed) {
      throw new ORPCError("TOO_MANY_REQUESTS", { message: "Превышен лимит действий. Попробуйте через час.", });
    }

    // Получаем ActionExecutor
    const actionExecutor = getActionExecutor();

    // Создаём временное правило для выполнения действия
    const tempRule = {
      id: crypto.randomUUID(),
      workspaceId,
      vacancyId,
      name: `Manual action: ${actionType}`,
      description: `Ручное действие от пользователя`,
      condition: {
        field: "fitScore" as const,
        operator: ">" as const,
        value: 0,
      },
      action: {
        type: actionType,
        params,
      },
      autonomyLevel: "autonomous" as const,
      priority: 100,
      enabled: true,
      stats: { triggered: 0, executed: 0, undone: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Создаём данные кандидата для выполнения
    const candidateData = {
      id: candidateId,
      fitScore: 100, // Ручное действие всегда проходит
      resumeScore: 0,
    };

    try {
      const result = await actionExecutor.executeAction(
        tempRule,
        candidateData,
        workspaceId,
        vacancyId,
        context.session.user.id,
      );

      // Логируем в audit log
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        workspaceId,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: candidateId,
        metadata: {
          type: `recruiter_agent_${actionType}`,
          actionType,
          vacancyId,
          params,
          status: result.status,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: result.status === "executed",
        actionId: result.ruleId,
        status: result.status,
        explanation: result.explanation,
        canUndo: result.canUndo,
        undoDeadline: result.undoDeadline,
        error: result.error,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Не удалось выполнить действие: ${errorMessage}`,
      });
    }
  });

/**
 * Undo Action procedure
 */
export const undoAction = protectedProcedure
  .input(undoActionInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, actionId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Проверка прав на отмену
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "undo_action",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "Нет прав на отмену действия", });
    }

    const actionExecutor = getActionExecutor();

    // Проверяем, можно ли отменить действие
    if (!actionExecutor.canUndoAction(actionId)) {
      throw new ORPCError("BAD_REQUEST", { message: "Действие не может быть отменено", });
    }

    try {
      const result = await actionExecutor.undoAction(
        actionId,
        context.session.user.id,
      );

      if (!result.success) {
        throw new ORPCError("BAD_REQUEST", { message: result.error ?? "Не удалось отменить действие", });
      }

      // Логируем в audit log
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        workspaceId,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: actionId,
        metadata: {
          type: "recruiter_agent_undo",
          actionId,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: true,
        message: "Действие успешно отменено",
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Не удалось отменить действие: ${errorMessage}`,
      });
    }
  });

/**
 * Approve pending action procedure
 */
export const approveAction = protectedProcedure
  .input(approveActionInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, approvalId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Проверка прав на выполнение правил
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "execute_rule",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "Нет прав на подтверждение действия", });
    }

    const actionExecutor = getActionExecutor();

    try {
      const result = await actionExecutor.executeApprovedAction(
        approvalId,
        workspaceId,
        context.session.user.id,
      );

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Запрос на подтверждение не найден или истёк", });
      }

      // Логируем в audit log
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        workspaceId,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: approvalId,
        metadata: {
          type: "recruiter_agent_approve",
          approvalId,
          ruleId: result.ruleId,
          status: result.status,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: result.status === "executed",
        status: result.status,
        explanation: result.explanation,
        canUndo: result.canUndo,
        undoDeadline: result.undoDeadline,
        error: result.error,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Не удалось подтвердить действие: ${errorMessage}`,
      });
    }
  });
