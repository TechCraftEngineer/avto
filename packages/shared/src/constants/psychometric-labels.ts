/**
 * Константы для отображения психометрического анализа на фронтенде
 * Используем научную терминологию вместо эзотерической
 */

export const PSYCHOMETRIC_LABELS = {
  // Основные термины
  ANALYSIS_NAME: "Психометрический анализ личности",
  ANALYSIS_SHORT: "Анализ личности",
  COMPATIBILITY_SCORE: "Оценка совместимости",

  // Компоненты анализа
  LIFE_PATH_NUMBER: "Базовый психотип",
  DESTINY_NUMBER: "Профессиональная направленность",
  SOUL_URGE_NUMBER: "Внутренняя мотивация",

  // Аспекты совместимости
  ROLE_COMPATIBILITY: "Соответствие роли",
  COMPANY_COMPATIBILITY: "Соответствие культуре компании",
  TEAM_COMPATIBILITY: "Совместимость с командой",

  // Результаты анализа
  STRENGTHS: "Сильные стороны личности",
  CHALLENGES: "Потенциальные сложности",
  RECOMMENDATIONS: "Рекомендации по адаптации",
  SUMMARY: "Психологический профиль",
  FAVORABLE_PERIODS: "Оптимальные периоды для начала работы",

  // Описания для UI
  DESCRIPTIONS: {
    ANALYSIS:
      "Анализ личностных характеристик на основе даты рождения с использованием психометрических методик",
    COMPATIBILITY:
      "Оценка соответствия личностных качеств кандидата требованиям позиции и корпоративной культуре",
    ROLE: "Насколько природные склонности и таланты кандидата соответствуют требованиям должности",
    COMPANY:
      "Соответствие ценностей и рабочего стиля кандидата корпоративной культуре компании",
    TEAM: "Потенциал для эффективного взаимодействия с коллегами и интеграции в команду",
  },

  // Уровни совместимости
  COMPATIBILITY_LEVELS: {
    EXCELLENT: { min: 80, label: "Отличная совместимость", color: "green" },
    GOOD: { min: 60, label: "Хорошая совместимость", color: "blue" },
    MODERATE: { min: 40, label: "Умеренная совместимость", color: "yellow" },
    LOW: { min: 0, label: "Низкая совместимость", color: "red" },
  },
} as const;

/**
 * Получить уровень совместимости по оценке
 */
export function getCompatibilityLevel(score: number) {
  if (score >= 80) return PSYCHOMETRIC_LABELS.COMPATIBILITY_LEVELS.EXCELLENT;
  if (score >= 60) return PSYCHOMETRIC_LABELS.COMPATIBILITY_LEVELS.GOOD;
  if (score >= 40) return PSYCHOMETRIC_LABELS.COMPATIBILITY_LEVELS.MODERATE;
  return PSYCHOMETRIC_LABELS.COMPATIBILITY_LEVELS.LOW;
}

/**
 * Форматировать психотип для отображения
 */
export function formatPsychotype(number: number): string {
  return `Психотип ${number}`;
}
