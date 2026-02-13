import { z } from "zod";

/**
 * Gig-related event schemas
 */

export const gigRankingRecalculateDataSchema = z.object({
  gigId: z.string().uuid("ID гига должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  triggeredBy: z.string().optional(),
});

export const gigShortlistRecalculateDataSchema = z.object({
  gigId: z.string().uuid("ID гига должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  triggeredBy: z.string().optional(),
});

export const gigResponseEvaluateDataSchema = z.object({
  responseId: z.string().uuid("ID отклика должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  chatSessionId: z.string().min(1, "ID сессии чата обязателен"),
});

export const gigSyncResponsesDataSchema = z.object({
  gigId: z.string().uuid("ID гига должен быть валидным UUID"),
});

export const kworkChatProcessDataSchema = z.object({
  responseId: z.string().uuid("ID отклика должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
});
