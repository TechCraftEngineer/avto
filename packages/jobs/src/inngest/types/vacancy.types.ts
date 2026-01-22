import { z } from "zod";

/**
 * Vacancy-related event schemas
 */

export const vacancyRequirementsExtractDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  description: z.string().min(1, "Description is required"),
});

export const vacancyUpdateActiveDataSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const vacancyUpdateSingleDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const vacancyResponsesRefreshDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const collectChatIdsDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const syncArchivedVacancyResponsesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const checkPublicationStatusDataSchema = z.object({
  publicationId: z.string().uuid("Publication ID is required"),
});

export const checkAllPublicationStatusesDataSchema = z.object({
  workspaceId: z.string().uuid().optional(), // Опционально, если не указан - проверяем все workspace
});

/**
 * Type inference
 */
export type VacancyRequirementsExtractPayload = z.infer<
  typeof vacancyRequirementsExtractDataSchema
>;
export type VacancyUpdateActivePayload = z.infer<
  typeof vacancyUpdateActiveDataSchema
>;
export type VacancyUpdateSinglePayload = z.infer<
  typeof vacancyUpdateSingleDataSchema
>;
export type VacancyResponsesRefreshPayload = z.infer<
  typeof vacancyResponsesRefreshDataSchema
>;
export type CollectChatIdsPayload = z.infer<typeof collectChatIdsDataSchema>;
export type SyncArchivedVacancyResponsesPayload = z.infer<
  typeof syncArchivedVacancyResponsesDataSchema
>;
export type CheckPublicationStatusPayload = z.infer<
  typeof checkPublicationStatusDataSchema
>;
export type CheckAllPublicationStatusesPayload = z.infer<
  typeof checkAllPublicationStatusesDataSchema
>;