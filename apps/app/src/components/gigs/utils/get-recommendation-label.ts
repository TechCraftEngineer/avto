/**
 * Преобразует значение рекомендации в читаемую метку
 */
export function getRecommendationLabel(
  recommendation: string | null | undefined,
): string {
  switch (recommendation) {
    case "HIGHLY_RECOMMENDED":
      return "Настоятельно рекомендуется";
    case "RECOMMENDED":
      return "Рекомендуется";
    case "NEUTRAL":
      return "Нейтрально";
    case "NOT_RECOMMENDED":
      return "Не рекомендуется";
    default:
      return "Не оценено";
  }
}
