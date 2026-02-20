/**
 * Типы для кандидатов
 */

import type { StoredProfileData } from "@qbs-autonaim/db";

/**
 * Базовая информация о кандидате
 */
export interface BasicCandidateInfo {
  fullName: string;
  currentPosition: string;
  location: string;
  photoUrl: string | null;
}

/**
 * Запись об опыте работы
 */
export interface WorkExperienceEntry {
  id?: string;
  position: string;
  company?: string | null;
  description?: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
}

/**
 * Запись об образовании
 */
export interface EducationEntry {
  id?: string;
  institution: string;
  degree?: string | null;
  field?: string | null;
  fieldOfStudy?: string;
  graduationYear?: number | null;
  startDate?: string;
  endDate?: string;
}

/**
 * Контактная информация кандидата
 */
export interface CandidateContactInfo {
  email: string | null;
  phone: string | null;
  socialLinks?: string[];
}

/**
 * Данные профиля фрилансера
 */
export interface FreelancerProfileData {
  id: string;
  name?: string | null;
  title?: string | null;
  rating?: number | null;
  completedGigs?: number | null;
  skills?: string[];
  hourlyRate?: number | null;
  bio?: string | null;
  workExperience?: WorkExperienceEntry[];
  education?: EducationEntry[];
}

/**
 * Базовые данные кандидата для импорта/создания
 */
export interface BaseCandidateData {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  headline?: string | null;
  location?: string | null;
  photoUrl?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
}

/**
 * Расширенные данные кандидата с профилем
 */
export interface ExtendedCandidateData extends BaseCandidateData {
  profileData?: {
    experience: WorkExperienceEntry[];
    education: EducationEntry[];
    parsedAt?: string;
  } | null;
  source?: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?:
    | "MANUAL"
    | "HH"
    | "AVITO"
    | "SUPERJOB"
    | "HABR"
    | "KWORK"
    | "FL_RU"
    | "FREELANCE_RU"
    | "WEB_LINK"
    | "TELEGRAM"
    | "LINKEDIN"
    | "HEADHUNTER";
  parsingStatus?: "COMPLETED" | "PENDING" | "FAILED";
}

/**
 * Данные кандидата из отклика
 */
export interface CandidateDataFromResponse extends BaseCandidateData {
  organizationId: string;
  resumeUrl?: string | null;
  photoFileId?: string | null;
  profileData?: StoredProfileData | null;
  salaryExpectationsAmount?: number | null;
  source?: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?:
    | "MANUAL"
    | "HH"
    | "AVITO"
    | "SUPERJOB"
    | "HABR"
    | "KWORK"
    | "FL_RU"
    | "FREELANCE_RU"
    | "WEB_LINK"
    | "TELEGRAM";
  birthDate?: Date | null;
  gender?: "male" | "female" | "other" | null;
  citizenship?: string | null;
  workFormat?: "remote" | "office" | "hybrid" | null;
  englishLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  readyForRelocation?: boolean | null;
  tags?: string[] | null;
  notes?: string | null;
}

/**
 * Данные кандидата для чата/контекста
 */
export interface CandidateContextData {
  id: string;
  candidateId: string;
  candidateName: string | null;
  proposedPrice?: number | null;
  proposedDeliveryDays?: number | null;
  coverLetter?: string | null;
  skills?: string[] | null;
  rating?: string | null;
  status: string;
  hrSelectionStatus?: string | null;
  compositeScore?: number | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendation?: string | null;
  screeningScore?: number | null;
  screeningDetailedScore?: number | null;
  screeningAnalysis?: string | null;
  interviewScore?: number | null;
  interviewDetailedScore?: number | null;
  interviewAnalysis?: string | null;
}

/**
 * Полная структура данных кандидата для расширения
 */
export interface FullCandidateData {
  platform: string;
  profileUrl: string;
  basicInfo: BasicCandidateInfo;
  experience: WorkExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  contacts: CandidateContactInfo;
  extractedAt: Date;
}
