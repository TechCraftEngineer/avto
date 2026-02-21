/**
 * Типы для откликов кандидатов
 */

/**
 * Базовые данные отклика
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

/**
 * Данные отклика для парсера
 */
export interface ParsedResponseData extends BaseResponseData {
  /** Дополнительные поля для парсинга */
}

/** Алиас для совместимости с jobs-parsers */
export type ResponseData = BaseResponseData;

/**
 * Контактная информация из резюме
 */
export interface ResumeContactInfo {
  phone: string | null;
  telegramUsername: string | null;
}

/**
 * Опыт работы из резюме (данные парсера)
 */
export interface ResumeExperience {
  experience: string;
  contacts: unknown;
  phone: string | null;
  telegramUsername: string | null;
  pdfBuffer: Buffer | null;
  photoBuffer: Buffer | null;
  photoMimeType: string | null;
}

/**
 * Данные резюме для скрининга
 */
export interface ResumeScreeningData {
  experience: string;
  education?: string;
  skills?: string;
  birthDate?: Date | string | null;
}
