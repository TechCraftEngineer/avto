import type { WorkspacePlan } from "@qbs-autonaim/db/schema";

/**
 * Лимиты для разных тарифных планов
 */
export const PLAN_LIMITS = {
  free: {
    responsesLimit: 20,
    name: "Бесплатный",
  },
  pro: {
    responsesLimit: 0, // 0 = без ограничений
    name: "Pro",
  },
  enterprise: {
    responsesLimit: 0, // 0 = без ограничений
    name: "Enterprise",
  },
} as const;

/**
 * Получить лимит откликов для тарифного плана
 * @param plan - тарифный план workspace
 * @returns количество откликов (0 = без ограничений)
 */
export function getResponsesLimit(plan: WorkspacePlan): number {
  return PLAN_LIMITS[plan].responsesLimit;
}

/**
 * Проверить, есть ли ограничение на количество откликов
 * @param plan - тарифный план workspace
 * @returns true если есть ограничение
 */
export function hasResponsesLimit(plan: WorkspacePlan): boolean {
  return PLAN_LIMITS[plan].responsesLimit > 0;
}

/**
 * Получить название тарифного плана
 * @param plan - тарифный план workspace
 * @returns название плана
 */
export function getPlanName(plan: WorkspacePlan): string {
  return PLAN_LIMITS[plan].name;
}
