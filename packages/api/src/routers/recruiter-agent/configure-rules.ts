/**
 * Configure Rules procedure для AI-ассистента рекрутера
 *
 * Управление правилами автоматизации:
 * - Создание правил
 * - Обновление правил
 * - Удаление правил
 * - Включение/выключение правил
 *
 * Requirements: 6.1, 6.2, 6.4
 */

import {
  type AutomationRule,
  type CompositeCondition,
  getRuleEngine,
  type RuleAction,
  type RuleCondition,
  RuleEngine,
} from "@qbs-autonaim/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { checkActionPermission, checkWorkspaceAccess } from "./middleware";

/**
 * Схема условия правила
 */
const ruleConditionSchema: z.ZodType<RuleCondition> = z.object({
  field: z.enum([
    "fitScore",
    "salaryExpectation",
    "experience",
    "availability",
    "skills",
    "resumeScore",
    "interviewScore",
  ]),
  operator: z.enum([
    ">",
    "<",
    "=",
    ">=",
    "<=",
    "!=",
    "contains",
    "not_contains",
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

/**
 * Схема составного условия
 */
const compositeConditionSchema: z.ZodType<CompositeCondition> = z.lazy(() =>
  z.object({
    type: z.enum(["AND", "OR"]),
    conditions: z.array(
      z.union([ruleConditionSchema, compositeConditionSchema]),
    ),
  }),
);

/**
 * Схема действия правила
 */
const ruleActionSchema: z.ZodType<RuleAction> = z.object({
  type: z.enum([
    "invite",
    "clarify",
    "reject",
    "notify",
    "pause_vacancy",
    "tag",
  ]),
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
 * Схема для создания правила
 */
const createRuleInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  condition: z.union([ruleConditionSchema, compositeConditionSchema]),
  action: ruleActionSchema,
  autonomyLevel: z.enum(["advise", "confirm", "autonomous"]).default("advise"),
  priority: z.number().min(0).max(1000).default(50),
  enabled: z.boolean().default(true),
});

/**
 * Схема для обновления правила
 */
const updateRuleInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  ruleId: z.uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  condition: z
    .union([ruleConditionSchema, compositeConditionSchema])
    .optional(),
  action: ruleActionSchema.optional(),
  autonomyLevel: z.enum(["advise", "confirm", "autonomous"]).optional(),
  priority: z.number().min(0).max(1000).optional(),
  enabled: z.boolean().optional(),
});

/**
 * Схема для удаления правила
 */
const deleteRuleInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  ruleId: z.uuid(),
});

/**
 * Схема для получения правил
 */
const getRulesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.uuid().optional(),
});

/**
 * Create Rule procedure
 */
export const createRule = protectedProcedure
  .input(createRuleInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      workspaceId,
      vacancyId,
      name,
      description,
      condition,
      action,
      autonomyLevel,
      priority,
      enabled,
    } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка прав на настройку правил
    const hasPermission = await checkActionPermission(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет прав на настройку правил",
      });
    }

    const ruleEngine = getRuleEngine();

    // Создаём правило
    const rule = RuleEngine.createRule({
      workspaceId,
      vacancyId,
      name,
      description,
      condition,
      action,
      autonomyLevel,
      priority,
      enabled,
    });

    ruleEngine.addRule(rule);

    // Логируем в audit log
    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      workspaceId,
      action: "CREATE",
      resourceType: "RULE",
      resourceId: rule.id,
      metadata: {
        type: "recruiter_agent_create_rule",
        ruleName: name,
        autonomyLevel,
        vacancyId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      success: true,
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        condition: rule.condition,
        action: rule.action,
        autonomyLevel: rule.autonomyLevel,
        priority: rule.priority,
        enabled: rule.enabled,
        stats: rule.stats,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      },
    };
  });

/**
 * Update Rule procedure
 */
export const updateRule = protectedProcedure
  .input(updateRuleInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, ruleId, ...updates } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка прав на настройку правил
    const hasPermission = await checkActionPermission(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет прав на настройку правил",
      });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Правило не найдено",
      });
    }

    // Проверяем, что правило принадлежит workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Правило не принадлежит этому workspace",
      });
    }

    // Обновляем правило
    const updatedRule: AutomationRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date(),
    };

    ruleEngine.addRule(updatedRule);

    // Логируем в audit log
    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      workspaceId,
      action: "UPDATE",
      resourceType: "RULE",
      resourceId: ruleId,
      metadata: {
        type: "recruiter_agent_update_rule",
        updates: Object.keys(updates),
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      success: true,
      rule: {
        id: updatedRule.id,
        name: updatedRule.name,
        description: updatedRule.description,
        condition: updatedRule.condition,
        action: updatedRule.action,
        autonomyLevel: updatedRule.autonomyLevel,
        priority: updatedRule.priority,
        enabled: updatedRule.enabled,
        stats: updatedRule.stats,
        createdAt: updatedRule.createdAt,
        updatedAt: updatedRule.updatedAt,
      },
    };
  });

/**
 * Delete Rule procedure
 */
export const deleteRule = protectedProcedure
  .input(deleteRuleInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, ruleId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка прав на настройку правил
    const hasPermission = await checkActionPermission(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет прав на настройку правил",
      });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Правило не найдено",
      });
    }

    // Проверяем, что правило принадлежит workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Правило не принадлежит этому workspace",
      });
    }

    const deleted = ruleEngine.removeRule(ruleId);

    if (!deleted) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось удалить правило",
      });
    }

    // Логируем в audit log
    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      workspaceId,
      action: "DELETE",
      resourceType: "RULE",
      resourceId: ruleId,
      metadata: {
        type: "recruiter_agent_delete_rule",
        ruleName: existingRule.name,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      success: true,
      message: "Правило успешно удалено",
    };
  });

/**
 * Get Rules procedure
 */
export const getRules = protectedProcedure
  .input(getRulesInputSchema)
  .query(async ({ input, ctx }) => {
    const { workspaceId, vacancyId } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const ruleEngine = getRuleEngine();

    const rules = vacancyId
      ? ruleEngine.getRulesForVacancy(workspaceId, vacancyId)
      : ruleEngine.getRulesForWorkspace(workspaceId);

    return {
      rules: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        condition: rule.condition,
        action: rule.action,
        autonomyLevel: rule.autonomyLevel,
        priority: rule.priority,
        enabled: rule.enabled,
        vacancyId: rule.vacancyId,
        stats: rule.stats,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
      total: rules.length,
    };
  });

/**
 * Toggle Rule procedure
 */
export const toggleRule = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      ruleId: z.uuid(),
      enabled: z.boolean(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, ruleId, enabled } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка прав на настройку правил
    const hasPermission = await checkActionPermission(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет прав на настройку правил",
      });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Правило не найдено",
      });
    }

    // Проверяем, что правило принадлежит workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Правило не принадлежит этому workspace",
      });
    }

    const success = ruleEngine.setRuleEnabled(ruleId, enabled);

    if (!success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось изменить статус правила",
      });
    }

    // Логируем в audit log
    await ctx.auditLogger.logAccess({
      userId: ctx.session.user.id,
      workspaceId,
      action: "UPDATE",
      resourceType: "RULE",
      resourceId: ruleId,
      metadata: {
        type: enabled
          ? "recruiter_agent_enable_rule"
          : "recruiter_agent_disable_rule",
        ruleName: existingRule.name,
        enabled,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      success: true,
      enabled,
      message: enabled ? "Правило включено" : "Правило выключено",
    };
  });

/**
 * Объединённый экспорт для configure-rules
 */
export const configureRules = {
  create: createRule,
  update: updateRule,
  delete: deleteRule,
  list: getRules,
  toggle: toggleRule,
};
