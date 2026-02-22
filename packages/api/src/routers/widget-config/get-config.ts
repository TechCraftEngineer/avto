/**
 * Get Widget Config Procedure
 *
 * Получает конфигурацию виджета для workspace.
 * Публичная процедура - используется виджетом на внешних сайтах.
 */

import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { WidgetConfigService } from "../../services/widget-config";

const getConfigInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
});

export const getConfig = publicProcedure
  .input(getConfigInputSchema)
  .handler(async ({ context, input }) => {
    const widgetConfigService = new WidgetConfigService(context.db);

    const config = await widgetConfigService.getConfig(input.workspaceId);

    // Return only public-facing configuration
    // (exclude internal fields like id, createdAt, updatedAt)
    return {
      workspaceId: config.workspaceId,
      branding: {
        logo: config.branding.logo,
        primaryColor: config.branding.primaryColor,
        secondaryColor: config.branding.secondaryColor,
        backgroundColor: config.branding.backgroundColor,
        textColor: config.branding.textColor,
        fontFamily: config.branding.fontFamily,
        assistantName: config.branding.assistantName,
        assistantAvatar: config.branding.assistantAvatar,
        welcomeMessage: config.branding.welcomeMessage,
        completionMessage: config.branding.completionMessage,
      },
      behavior: {
        tone: config.behavior.tone,
        maxDialogueTurns: config.behavior.maxDialogueTurns,
        sessionTimeoutMinutes: config.behavior.sessionTimeoutMinutes,
      },
      legal: {
        consentText: config.legal.consentText,
        disclaimerText: config.legal.disclaimerText,
        privacyPolicyUrl: config.legal.privacyPolicyUrl,
      },
    };
  });
