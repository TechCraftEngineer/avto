/**
 * Типы для импорта вакансий и откликов
 */

export interface ImportProgress {
  stage: "vacancies" | "responses" | "resume-details" | "photos";
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  vacanciesImported?: number;
  responsesImported?: number;
  error?: string;
}
