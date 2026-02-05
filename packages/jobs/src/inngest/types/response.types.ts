import { z } from "zod";

/**
 * Response-related event schemas
 */

export const responseScreenDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
});

export const screenNewResponsesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const screenAllResponsesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const analyzeSingleResponseDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
});

export const screenResponsesBatchDataSchema = z.object({
  workspaceId: z.string().min(1, "Идентификатор рабочей области обязателен"),
  responseIds: z
    .array(z.string())
    .min(1, "Требуется хотя бы один идентификатор отклика"),
});

export const parseNewResumesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const refreshSingleResumeDataSchema = z.object({
  responseId: z.string().min(1, "Response ID is required"),
});

export const refreshAllResumesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const parseMissingContactsDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const recommendationGenerateDataSchema = z.object({
  responseId: z.string().min(1, "Требуется идентификатор ответа"),
});

export const vacancyRecommendationGenerateDataSchema = z.object({
  responseId: z.string().min(1, "Требуется идентификатор ответа"),
});

export const gigRecommendationGenerateDataSchema = z.object({
  responseId: z.string().min(1, "Требуется идентификатор ответа"),
});

/**
 * Type inference
 */
export type ResponseScreenPayload = z.infer<typeof responseScreenDataSchema>;
export type ScreenNewResponsesPayload = z.infer<
  typeof screenNewResponsesDataSchema
>;
export type ScreenAllResponsesPayload = z.infer<
  typeof screenAllResponsesDataSchema
>;
export type AnalyzeSingleResponsePayload = z.infer<
  typeof analyzeSingleResponseDataSchema
>;
export type ScreenResponsesBatchPayload = z.infer<
  typeof screenResponsesBatchDataSchema
>;
export type ParseNewResumesPayload = z.infer<typeof parseNewResumesDataSchema>;
export type RefreshSingleResumePayload = z.infer<
  typeof refreshSingleResumeDataSchema
>;
export type RefreshAllResumesPayload = z.infer<
  typeof refreshAllResumesDataSchema
>;
export type ParseMissingContactsPayload = z.infer<
  typeof parseMissingContactsDataSchema
>;
export type RecommendationGeneratePayload = z.infer<
  typeof recommendationGenerateDataSchema
>;
export type VacancyRecommendationGeneratePayload = z.infer<
  typeof vacancyRecommendationGenerateDataSchema
>;
export type GigRecommendationGeneratePayload = z.infer<
  typeof gigRecommendationGenerateDataSchema
>;
