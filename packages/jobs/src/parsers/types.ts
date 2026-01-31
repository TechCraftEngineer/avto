export interface VacancyData {
  id: string; // Внутренний ID (может совпадать с externalId для HH)
  externalId?: string;
  source: "hh" | "avito" | "superjob" | "fl" | "freelance";
  title: string;
  url: string | null;
  views: string;
  responses: string;
  responsesUrl: string | null;
  newResponses: string;
  resumesInProgress: string;
  suitableResumes: string;
  region?: string; // Опционально: не все источники предоставляют географический регион (например, фриланс-платформы)
  description: string;
  isActive?: boolean; // Статус активности вакансии (false для архивных)
}

export interface ResponseData {
  name: string;
  url: string;
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
  telegramUsername?: string | null;
  resumePdfFileId?: string | null;
  photoFileId?: string | null;
}

export interface ProgressData {
  currentPage: number;
  totalSaved: number;
  totalSkipped: number;
  message: string;
}

export type ProgressCallback = (progress: ProgressData) => void | Promise<void>;
