import { z } from "zod";

/**
 * Общие типы для демо данных
 */

const safeIdRegex = /^[a-zA-Z0-9_-]+$/;

export const CandidatePhotoSchema = z.object({
  candidateId: z
    .string()
    .min(1)
    .regex(
      safeIdRegex,
      "candidateId must contain only alphanumerics, dashes, and underscores",
    ),
  candidateName: z.string(),
  photoUrl: z.string().url(),
  photoDescription: z.string(),
});

export type CandidatePhoto = z.infer<typeof CandidatePhotoSchema>;

export interface DemoUserIds {
  recruiterId: string;
  managerId: string;
  clientId: string;
}

export interface DemoOrganization {
  organizationId: string;
  workspaceId: string;
}

export interface PhotoMapping {
  [candidateId: string]: string;
}

export interface VacancyMapping {
  [oldId: string]: string;
}

export interface GigMapping {
  [oldId: string]: string;
}

export interface ResponseMapping {
  [candidateId: string]: string;
}
