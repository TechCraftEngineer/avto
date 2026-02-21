/**
 * Типы для vacancy в AI-чате
 * Централизованный источник для vacancy-config и vacancy-loader
 */

import type { CandidateContextData } from "@qbs-autonaim/shared";

/** Основной контекст вакансии для промпта */
export interface VacancyMainContext {
  id: string;
  title: string;
  description: string | null;
  requirements: unknown;
  region: string | null;
  workLocation: string | null;
  customBotInstructions: string | null;
}

/** Расширенный тип кандидата для vacancy с дополнительными полями */
export interface VacancyCandidateData extends CandidateContextData {
  salaryExpectationsAmount: number | null;
  profileUrl: string | null;
}
