import { z } from "zod";

// Zod схемы для валидации данных из realtime сообщений
export const progressStatusSchema = z.enum([
  "processing",
  "completed",
  "error",
]);

export const progressDataSchema = z.object({
  vacancyId: z.string(),
  status: progressStatusSchema,
  message: z.string(),
  currentPage: z.number().optional(),
  totalSaved: z.number().optional(),
  totalSkipped: z.number().optional(),
});

export const archivedStatusDataSchema = z.object({
  status: progressStatusSchema,
  message: z.string(),
  vacancyId: z.string(),
  syncedResponses: z.number().optional(),
  newResponses: z.number().optional(),
  vacancyTitle: z.string().optional(),
});

export const analyzeProgressDataSchema = z.object({
  batchId: z.string(),
  total: z.number(),
  processed: z.number(),
  successful: z.number(),
  failed: z.number(),
});

export const analyzeResultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
});

export const resultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  newCount: z.number(),
  totalResponses: z.number(),
  error: z.string().optional(),
});
