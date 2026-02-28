import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";

/**
 * Vacancy-related event schemas
 */

export const vacancyRequirementsExtractDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  description: z.string().min(1, "Description is required"),
});

export const vacancyUpdateActiveDataSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export const vacancyUpdateSingleDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const vacancyResponsesRefreshDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  workspaceId: workspaceIdSchema,
});

export const collectChatIdsDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
});

export const syncArchivedVacancyResponsesDataSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  workspaceId: workspaceIdSchema,
});

export const checkPublicationStatusDataSchema = z.object({
  publicationId: z.uuid({ error: "ID публикации обязателен" }),
});

export const checkAllPublicationStatusesDataSchema = z.object({
  workspaceId: workspaceIdSchema.optional(), // Опционально, если не указан - проверяем все workspace
});

export const vacancyImportNewDataSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
});

export const vacancyImportArchivedDataSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
});

export const vacancyImportArchivedSelectedDataSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancyIds: z
    .array(z.string())
    .min(1, "Необходимо выбрать хотя бы одну вакансию"),
});

export const vacancyImportByUrlDataSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  url: z.url({ error: "Некорректная ссылка" }),
  requestId: z.string().min(1, "ID запроса обязателен"),
});

export const vacancyFetchArchivedListDataSchema = z.object({
  workspaceId: workspaceIdSchema,
  requestId: z.string().min(1, "ID запроса обязателен"),
});

export const vacancyFetchActiveListDataSchema = z.object({
  workspaceId: workspaceIdSchema,
  requestId: z.string().min(1, "ID запроса обязателен"),
});

export const vacancyImportNewSelectedDataSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyIds: z
    .array(z.string())
    .min(1, "Необходимо выбрать хотя бы одну вакансию"),
  vacancies: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().url({ message: "Неверный URL вакансии" }),
        region: z.string().optional(),
      }),
    )
    .optional(),
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
export type VacancyImportNewPayload = z.infer<
  typeof vacancyImportNewDataSchema
>;
export type VacancyImportArchivedPayload = z.infer<
  typeof vacancyImportArchivedDataSchema
>;
export type VacancyImportArchivedSelectedPayload = z.infer<
  typeof vacancyImportArchivedSelectedDataSchema
>;
export type VacancyImportByUrlPayload = z.infer<
  typeof vacancyImportByUrlDataSchema
>;
export type VacancyFetchArchivedListPayload = z.infer<
  typeof vacancyFetchArchivedListDataSchema
>;
export type VacancyFetchActiveListPayload = z.infer<
  typeof vacancyFetchActiveListDataSchema
>;
export type VacancyImportNewSelectedPayload = z.infer<
  typeof vacancyImportNewSelectedDataSchema
>;
