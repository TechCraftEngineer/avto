/**
 * Общие типы для демо данных
 */

export interface CandidatePhoto {
  candidateId: string;
  candidateName: string;
  photoUrl: string;
  photoDescription: string;
}

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
