import { z } from "zod";

// Zod схемы для валидации данных из realtime сообщений
export const progressStatusSchema = z.enum([
  "started",
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
  totalResponses: z.number().optional(), // Общее количество для расчёта процента
});

export const archivedResultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  syncedResponses: z.number(),
  newResponses: z.number(),
  vacancyTitle: z.string(),
});

export const analyzeProgressDataSchema = z.object({
  vacancyId: z.string(),
  status: z.enum(["started", "processing", "completed", "error"]),
  message: z.string(),
  total: z.number().optional(),
  processed: z.number().optional(),
  failed: z.number().optional(),
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
