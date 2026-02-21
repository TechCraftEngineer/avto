/**
 * Централизованные типы для вакансий
 * Источник: tRPC RouterOutputs
 */

import type { RouterOutputs } from "@qbs-autonaim/api";

/** Элемент списка вакансий (getVacancies) */
export type VacancyListItem =
  RouterOutputs["freelancePlatforms"]["getVacancies"][number];
