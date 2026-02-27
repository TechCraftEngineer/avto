import { z } from "zod";

/**
 * Общие типы для демо данных
 */

export const CandidatePhotoSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  photoUrl: z.string(),
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
