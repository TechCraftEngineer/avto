import {
  type PlatformSource,
  platformSourceValues,
  responseStatusValues as statusValues,
} from "@qbs-autonaim/types";
import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Унифицированные enum'ы для всех типов откликов (gig, vacancy, project)
 */

/** Статус отклика (pg enum для Drizzle) */
export const responseStatusEnum = pgEnum("response_status", [
  ...statusValues,
] as [string, ...string[]]);

export type { ResponseStatus } from "@qbs-autonaim/types";
/** Re-export из @qbs-autonaim/types для обратной совместимости */
export { responseStatusValues } from "@qbs-autonaim/types";

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
 * Значения и тип из @qbs-autonaim/types
 */
export { type PlatformSource, platformSourceValues } from "@qbs-autonaim/types";

export const platformSourceEnum = pgEnum(
  "platform_source",
  platformSourceValues,
);

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

export type CareerTrajectoryType = (typeof careerTrajectoryTypeValues)[number];
