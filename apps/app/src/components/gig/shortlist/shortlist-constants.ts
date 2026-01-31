export const MIN_SCORE_OPTIONS = [
  { value: "70", label: "От 70 (рекомендуется)" },
  { value: "60", label: "От 60" },
  { value: "50", label: "От 50" },
  { value: "0", label: "Все оценки" },
] as const;

export const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case "HIGHLY_RECOMMENDED":
      return "Настоятельно рекомендован";
    case "RECOMMENDED":
      return "Рекомендован";
    case "NEUTRAL":
      return "Нейтрально";
    case "NOT_RECOMMENDED":
      return "Не рекомендован";
    default:
      return recommendation;
  }
};
