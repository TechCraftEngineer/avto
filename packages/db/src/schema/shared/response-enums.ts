import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Унифицированные enum'ы для всех типов откликов (gig, vacancy, project)
 */

/**
 * Статус отклика
 */
export const responseStatusEnum = pgEnum("response_status", [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
]);

export const responseStatusValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
] as const;

export type ResponseStatus = (typeof responseStatusValues)[number];

/**
 * HR статус отбора
 */
export const hrSelectionStatusEnum = pgEnum("hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "ONBOARDING",
  "DONE",
]);

export const hrSelectionStatusValues = [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "ONBOARDING",
  "DONE",
] as const;

export type HrSelectionStatus = (typeof hrSelectionStatusValues)[number];

/**
 * Допустимые значения hrSelectionStatus для gig response'ов
 * (ограниченный набор по сравнению с общим enum'ом)
 */
export const gigHrSelectionStatusValues = [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "DONE",
] as const;

export type GigHrSelectionStatus = (typeof gigHrSelectionStatusValues)[number];

/**
 * Источник платформы (откуда пришла вакансия или отклик)
 */
export const platformSourceValues = [
  "MANUAL",
  "HH",
  "AVITO",
  "SUPERJOB",
  "HABR",
  "KWORK",
  "FL_RU",
  "FREELANCE_RU",
  "WEB_LINK",
  "TELEGRAM",
] as const;

export const platformSourceEnum = pgEnum(
  "platform_source",
  platformSourceValues,
);

export type PlatformSource = (typeof platformSourceValues)[number];

// Остальные значения для обратной совместимости, если нужно
export const importSourceEnum = platformSourceEnum;
export const importSourceValues = platformSourceValues;
export type ImportSource = PlatformSource;

/**
 * Рекомендация по кандидату
 */
export const recommendationEnum = pgEnum("recommendation", [
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
]);

export const recommendationValues = [
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
] as const;

export type Recommendation = (typeof recommendationValues)[number];

/**
 * Тип карьерной траектории
 */
export const careerTrajectoryTypeEnum = pgEnum("career_trajectory_type", [
  "growth",
  "stable",
  "decline",
  "jump",
  "role_change",
]);

export const careerTrajectoryTypeValues = [
  "growth",
  "stable",
  "decline",
  "jump",
  "role_change",
] as const;

export type CareerTrajectoryType =
  (typeof careerTrajectoryTypeValues)[number];
