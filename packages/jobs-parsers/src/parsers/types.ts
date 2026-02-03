export interface VacancyData {
  id: string; // Внутренний ID (может совпадать с externalId для HH)
  externalId?: string;
  source: "hh" | "avito" | "superjob" | "fl" | "freelance" | "kwork";
  title: string;
  url: string | null;
  views: string;
  responses: string;
  responsesUrl: string | null;
  newResponses: string;
  resumesInProgress: string;
  suitableResumes: string;
  region?: string; // Регион размещения вакансии (где опубликована)
  workLocation?: string; // Локация работы (где фактически нужно работать)
  description: string;
  isActive?: boolean; // Статус активности вакансии (false для архивных)
}

export interface ResponseData {
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

export interface ResumeExperience {
  experience: string;
  contacts: unknown;
  phone: string | null;
  telegramUsername: string | null;
  pdfBuffer: Buffer | null;
  photoBuffer: Buffer | null;
  photoMimeType: string | null;
}

export interface SaveResponseData {
  vacancyId: string;
  resumeId: string;
  resumeUrl: string;
  candidateName: string;
  experience: string;
  contacts: unknown;
  phone: string | null;
  email?: string | null;
  telegramUsername?: string | null;
  resumePdfFileId?: string | null;
  photoFileId?: string | null;
  globalCandidateId?: string | null;
  birthDate?: Date | null;
}

export interface ProgressData {
  currentPage: number;
  totalSaved: number;
  totalSkipped: number;
  message: string;
}

export type ProgressCallback = (progress: ProgressData) => void | Promise<void>;
