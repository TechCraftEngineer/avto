/**
 * Получить русское название тарифного плана
 */
export function getPlanDisplayName(
  plan: "free" | "pro" | "enterprise" | null | undefined,
): string {
  if (!plan) return "Бесплатный";

  const names: Record<string, string> = {
    free: "Бесплатный",
    pro: "Профессиональный",
    enterprise: "Корпоративный",
  };

  return names[plan] ?? "Бесплатный";
}
