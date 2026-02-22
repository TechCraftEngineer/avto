/**
 * Configure Rules procedure ��� AI-���������� ���������
 *
 * ���������� ��������� �������������:
 * - �������� ������
 * - ���������� ������
 * - �������� ������
 * - ���������/���������� ������
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
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { checkActionPermission, checkWorkspaceAccess } from "./middleware";

/**
 * ����� ������� �������
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
 * ����� ���������� �������
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
 * ����� �������� �������
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
 * ����� ��� �������� �������
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
 * ����� ��� ���������� �������
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
 * ����� ��� �������� �������
 */
const deleteRuleInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  ruleId: z.uuid(),
});

/**
 * ����� ��� ��������� ������
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
  .handler(async ({ input, context }) => {
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

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    // �������� ���� �� ��������� ������
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "��� ���� �� ��������� ������", });
    }

    const ruleEngine = getRuleEngine();

    // ������ �������
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

    // �������� � audit log
    await context.auditLogger.logAccess({
      userId: context.session.user.id,
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
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
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
  .handler(async ({ input, context }) => {
    const { workspaceId, ruleId, ...updates } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    // �������� ���� �� ��������� ������
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "��� ���� �� ��������� ������", });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new ORPCError("NOT_FOUND", { message: "������� �� �������", });
    }

    // ���������, ��� ������� ����������� workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "������� �� ����������� ����� workspace", });
    }

    // ��������� �������
    const updatedRule: AutomationRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date(),
    };

    ruleEngine.addRule(updatedRule);

    // �������� � audit log
    await context.auditLogger.logAccess({
      userId: context.session.user.id,
      workspaceId,
      action: "UPDATE",
      resourceType: "RULE",
      resourceId: ruleId,
      metadata: {
        type: "recruiter_agent_update_rule",
        updates: Object.keys(updates),
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
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
  .handler(async ({ input, context }) => {
    const { workspaceId, ruleId } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    // �������� ���� �� ��������� ������
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "��� ���� �� ��������� ������", });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new ORPCError("NOT_FOUND", { message: "������� �� �������", });
    }

    // ���������, ��� ������� ����������� workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "������� �� ����������� ����� workspace", });
    }

    const deleted = ruleEngine.removeRule(ruleId);

    if (!deleted) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "�� ������� ������� �������", });
    }

    // �������� � audit log
    await context.auditLogger.logAccess({
      userId: context.session.user.id,
      workspaceId,
      action: "DELETE",
      resourceType: "RULE",
      resourceId: ruleId,
      metadata: {
        type: "recruiter_agent_delete_rule",
        ruleName: existingRule.name,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: "������� ������� �������",
    };
  });

/**
 * Get Rules procedure
 */
export const getRules = protectedProcedure
  .input(getRulesInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, vacancyId } = input;

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
  .handler(async ({ input, context }) => {
    const { workspaceId, ruleId, enabled } = input;

    // �������� ������� � workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace", });
    }

    // �������� ���� �� ��������� ������
    const hasPermission = await checkActionPermission(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
      "configure_rules",
    );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", { message: "��� ���� �� ��������� ������", });
    }

    const ruleEngine = getRuleEngine();
    const existingRule = ruleEngine.getRule(ruleId);

    if (!existingRule) {
      throw new ORPCError("NOT_FOUND", { message: "������� �� �������", });
    }

    // ���������, ��� ������� ����������� workspace
    if (existingRule.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "������� �� ����������� ����� workspace", });
    }

    const success = ruleEngine.setRuleEnabled(ruleId, enabled);

    if (!success) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "�� ������� �������� ������ �������", });
    }

    // �������� � audit log
    await context.auditLogger.logAccess({
      userId: context.session.user.id,
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
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      enabled,
      message: enabled ? "������� ��������" : "������� ���������",
    };
  });

/**
 * ������������ ������� ��� configure-rules
 */
export const configureRules = {
  create: createRule,
  update: updateRule,
  delete: deleteRule,
  list: getRules,
  toggle: toggleRule,
};
