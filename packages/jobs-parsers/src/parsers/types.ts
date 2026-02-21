import type {
  BaseResponseData,
  ParsedVacancyData,
  ResumeExperience as SharedResumeExperience,
} from "@qbs-autonaim/shared";

/** Данные вакансии из парсера (алиас ParsedVacancyData) */
export type VacancyData = ParsedVacancyData;

/** Данные отклика (алиас BaseResponseData) */
export type ResponseData = BaseResponseData;

/** Опыт работы из резюме (импорт из shared) */
export type ResumeExperience = SharedResumeExperience;

export interface ProgressData {
  currentPage: number;
  totalSaved: number;
  totalSkipped: number;
  message: string;
}

export type ProgressCallback = (progress: ProgressData) => void | Promise<void>;
