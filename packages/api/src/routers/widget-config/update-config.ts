/**
 * Update Widget Config Procedure
 *
 * Обновляет конфигурацию виджета для workspace.
 * Защищённая процедура - требует авторизации и прав администратора.
 */

import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  WidgetConfigError,
  WidgetConfigService,
} from "../../services/widget-config";
import { protectedProcedure } from "../../orpc";

const brandingConfigSchema = z
  .object({
    logo: z.url().nullish(),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный цвет")
      .optional(),
    secondaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный цвет")
      .optional(),
    backgroundColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный цвет")
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный цвет")
      .optional(),
    fontFamily: z.string().max(100).optional(),
    assistantName: z.string().max(100).optional(),
    assistantAvatar: z.url().nullish(),
    welcomeMessage: z.string().max(1000).nullish(),
    completionMessage: z.string().max(1000).nullish(),
  })
  .optional();

const behaviorConfigSchema = z
  .object({
    passThreshold: z.number().min(0).max(100).optional(),
    mandatoryQuestions: z.array(z.string().max(500)).max(10).optional(),
    tone: z.enum(["formal", "friendly"]).optional(),
    honestyLevel: z.enum(["direct", "diplomatic", "encouraging"]).optional(),
    maxDialogueTurns: z.number().min(3).max(30).optional(),
    sessionTimeoutMinutes: z.number().min(5).max(120).optional(),
  })
  .optional();

const legalConfigSchema = z
  .object({
    consentText: z.string().max(5000).nullish(),
    disclaimerText: z.string().max(5000).nullish(),
    privacyPolicyUrl: z.url().nullish(),
    dataRetentionDays: z.number().min(1).max(365).optional(),
  })
  .optional();

const updateConfigInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  branding: brandingConfigSchema,
  behavior: behaviorConfigSchema,
  legal: legalConfigSchema,
});

export const updateConfig = protectedProcedure
  .input(updateConfigInputSchema)
  .handler(async ({ context, input }) => {
    // Verify user has access to workspace
    const membership = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!membership) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    // Check if user has admin role
    if (membership.role !== "admin" && membership.role !== "owner") {
      throw new ORPCError("FORBIDDEN", { message: "Только администраторы могут изменять настройки виджета", });
    }

    const widgetConfigService = new WidgetConfigService(context.db);

    try {
      const updatedConfig = await widgetConfigService.updateConfig(
        input.workspaceId,
        {
          branding: input.branding,
          behavior: input.behavior,
          legal: input.legal,
        },
      );

      // Log audit event using existing method
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        action: "UPDATE",
        resourceType: "VACANCY", // Using existing enum value
        resourceId: updatedConfig.id,
        metadata: {
          type: "widget_config_update",
          workspaceId: input.workspaceId,
          updatedFields: {
            branding: input.branding ? Object.keys(input.branding) : [],
            behavior: input.behavior ? Object.keys(input.behavior) : [],
            legal: input.legal ? Object.keys(input.legal) : [],
          },
        },
      });

      return {
        success: true,
        config: updatedConfig,
      };
    } catch (error) {
      if (error instanceof WidgetConfigError) {
        throw new ORPCError("BAD_REQUEST", { message: error.userMessage,
          cause: error, });
      }
      throw error;
    }
  });
