import type { StoredProfileData } from "../types";

/**
 * Тип данных кандидата, извлекаемых из отклика.
 * Используется CandidateService для передачи в GlobalCandidateRepository.
 */
export interface CandidateDataFromResponse {
  organizationId: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  headline?: string | null;
  resumeUrl?: string | null;
  profileData?: StoredProfileData | null;
  skills?: string[] | null;
  experienceYears?: number | null;
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
  location?: string | null;
  birthDate?: Date | null;
  gender?: "male" | "female" | "other" | null;
  citizenship?: string | null;
  workFormat?: "remote" | "office" | "hybrid" | null;
  englishLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  readyForRelocation?: boolean | null;
  tags?: string[] | null;
  notes?: string | null;
}
