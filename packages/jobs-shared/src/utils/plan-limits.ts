import type { WorkspacePlan } from "@qbs-autonaim/db/schema";

/**
 * Лимиты для разных тарифных планов workspace
 */
export const PLAN_LIMITS = {
  free: {
    responsesLimit: 10,
    name: "Бесплатный",
  },
  pro: {
    responsesLimit: 500, // 0 = без ограничений
    name: "Pro",
  },
  enterprise: {
    responsesLimit: 0, // 0 = без ограничений
    name: "Enterprise",
  },
} as const;

/** Лимиты для планов организации (включая starter) */
export const ORGANIZATION_PLAN_LIMITS: Record<
  "free" | "starter" | "pro" | "enterprise",
  number
> = {
  free: 10,
  starter: 150,
  pro: 500,
  enterprise: 0, // 0 = без ограничений
};

/**
 * Получить лимит откликов для тарифного плана workspace
 * @param plan - тарифный план workspace
 * @returns количество откликов (0 = без ограничений)
 */
export function getResponsesLimit(plan: WorkspacePlan): number {
  return PLAN_LIMITS[plan].responsesLimit;
}

/**
 * Получить лимит откликов по плану организации.
 * Используется для лимитов импорта — воркспейс наследует план организации.
 * @param plan - тарифный план организации
 * @returns количество откликов (0 = без ограничений)
 */
export function getResponsesLimitByOrganizationPlan(
  plan: "free" | "starter" | "pro" | "enterprise",
): number {
  return ORGANIZATION_PLAN_LIMITS[plan] ?? ORGANIZATION_PLAN_LIMITS.free;
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
