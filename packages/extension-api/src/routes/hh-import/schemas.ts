import { z } from "zod";

export const vacancyItemSchema = z.object({
  externalId: z.string(),
  title: z.string(),
  url: z.string(),
  region: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const vacanciesBodySchema = z.object({
  workspaceId: z.string(),
  vacancies: z.array(vacancyItemSchema).min(1),
});

export const responseItemSchema = z.object({
  resumeId: z.string(),
  resumeUrl: z.string(),
  name: z.string(),
  respondedAt: z.string().optional(),
  coverLetter: z.string().optional(),
  photoUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, {
      message:
        "photoUrl должен быть в формате base64 (data:image/...;base64,...)",
    })
    .optional(),
  resumeTextHtml: z.string().optional(),
  resumePdfBase64: z
    .string()
    .regex(/^data:application\/pdf;base64,/, {
      message:
        "resumePdfBase64 должен быть в формате data:application/pdf;base64,...",
    })
    .optional(),
});

export const responsesBodySchema = z.object({
  workspaceId: z.string(),
  vacancyId: z.string().optional(),
  vacancyExternalId: z.string(),
  responses: z.array(responseItemSchema).min(1),
});

export const parseVacancyHtmlSchema = z.object({
  workspaceId: z.string(),
  vacancyExternalId: z.string(),
  vacancyUrl: z.string().url(),
  htmlContent: z.string(),
  isArchived: z.boolean().optional(),
  region: z.string().optional(),
});
