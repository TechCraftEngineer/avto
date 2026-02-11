import type { OrganizationPlan } from "../schema/organization/organization";
import type { WorkspacePlan } from "../schema/workspace/workspace";

/**
 * Получает эффективный тарифный план для воркспейса
 *
 * Текущая логика: воркспейс наследует план организации
 *
 * Будущее: можно добавить поле billingType в workspace для независимого биллинга
 *
 * @param workspace - воркспейс (может содержать свой план для будущего использования)
 * @param organization - организация с тарифным планом
 * @returns эффективный план для воркспейса
 */
export function getEffectivePlan(
  _workspace: { plan?: WorkspacePlan },
  organization: { plan: OrganizationPlan },
): WorkspacePlan {
  // Текущая логика: всегда используем план организации
  // В будущем здесь можно добавить проверку workspace.billingType
  return organization.plan as WorkspacePlan;
}

/**
 * Проверяет, может ли воркспейс использовать функцию на основе плана
 *
 * @param workspace - воркспейс
 * @param organization - организация
 * @param requiredPlan - минимально необходимый план
 * @returns true если план достаточен
 */
export function hasFeatureAccess(
  workspace: { plan?: WorkspacePlan },
  organization: { plan: OrganizationPlan },
  requiredPlan: "free" | "pro" | "enterprise",
): boolean {
  const effectivePlan = getEffectivePlan(workspace, organization);

  const planHierarchy: Record<"free" | "pro" | "enterprise", number> = {
    free: 0,
    pro: 1,
    enterprise: 2,
  };

  return (
    (planHierarchy[effectivePlan] ?? 0) >= (planHierarchy[requiredPlan] ?? 0)
  );
}
