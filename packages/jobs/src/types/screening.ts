/**
 * Типы для системы скрининга резюме
 */

import type {
  ResumeScreeningData as SharedResumeScreeningData,
  ScreeningResult as SharedScreeningResult,
  VacancyRequirementsStrict,
} from "@qbs-autonaim/shared";

// Переэкспорты из shared
export type ScreeningResult = SharedScreeningResult;
export type ResumeScreeningData = SharedResumeScreeningData;
export type VacancyRequirements = VacancyRequirementsStrict;

/**
 * Данные для генерации промпта
 */
export interface ScreeningPromptData {
  /** ID вакансии */
  vacancyId: string;

  /** Название вакансии */
  title: string;

  /** Описание вакансии */
  description: string;
}
