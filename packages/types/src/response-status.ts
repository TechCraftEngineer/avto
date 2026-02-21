/**
 * Единый источник статусов отклика.
 * Используется в db/schema, validators, api.
 */

export const responseStatusValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
] as const;

export type ResponseStatus = (typeof responseStatusValues)[number];

/** Подмножество для фильтра vacancy responses (без NEGOTIATION в UI-фильтре) */
export const vacancyResponseStatusFilterValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "COMPLETED",
  "SKIPPED",
] as const;

export type VacancyResponseStatusFilter =
  (typeof vacancyResponseStatusFilterValues)[number];
