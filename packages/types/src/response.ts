/**
 * Типы для откликов кандидатов
 */

export interface BaseResponseData {
  name: string;
  url: string;
  resumeId?: string;
  resumeUrl?: string;
  externalId?: string;
  respondedAt?: string;
  status?: string;
  coverLetter?: string;
  vacancyId?: string;
  candidateId?: string;
}

export interface ParsedResponseData extends BaseResponseData {}

export type ResponseData = BaseResponseData;

export interface ResumeContactInfo {
  phone: string | null;
  telegramUsername: string | null;
}

export interface ResumeExperience {
  experience: string;
  contacts: unknown;
  phone: string | null;
  telegramUsername: string | null;
  pdfBuffer: Buffer | null;
  photoBuffer: Buffer | null;
  photoMimeType: string | null;
}

export interface ResumeScreeningData {
  experience: string;
  education?: string;
  skills?: string;
  birthDate?: Date | string | null;
}
