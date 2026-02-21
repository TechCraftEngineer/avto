/**
 * Централизованные типы для вакансий
 * Источник: tRPC RouterOutputs и селекторы
 */

import type { RouterOutputs } from "@qbs-autonaim/api";

/** Элемент списка вакансий (getVacancies) */
export type VacancyListItem =
  RouterOutputs["freelancePlatforms"]["getVacancies"]["vacancies"][number];

/** Вакансия в архиве (для ArchivedVacanciesSelector) */
export interface ArchivedVacancy {
  id: string;
  title: string;
  region?: string;
  workLocation?: string;
  archivedAt?: string;
  isImported?: boolean;
}

/** Активная вакансия (для ActiveVacanciesSelector) */
export interface ActiveVacancy {
  id: string;
  title: string;
  region?: string;
  views?: string;
  responses?: string;
  isImported?: boolean;
}
