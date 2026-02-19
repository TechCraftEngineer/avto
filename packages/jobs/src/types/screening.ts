/**
 * Типы для системы скрининга резюме
 */

/**
 * Рекомендация по результатам скрининга
 */
export type ScreeningRecommendation = "invite" | "reject" | "need_info";

/**
 * Результат скрининга резюме
 */
export interface ScreeningResult {
  /** Процент соответствия резюме вакансии (0-100) */
  match_percentage: number;

  /** Рекомендация: пригласить, отклонить или нужна доп. информация */
  recommendation: ScreeningRecommendation;

  /** Сильные стороны кандидата */
  strengths: string[];

  /** Слабые стороны или недостающие навыки */
  weaknesses: string[];

  /** Краткое резюме оценки */
  summary: string;
}

/**
 * Данные для генерации промпта
 */
export interface ScreeningPromptData {
  /** ID вакансии */
  vacancyId: string;

  /** Название вакансии */
  title: string;

  /** Описание вакансии */
  description: string;
}

/**
 * Данные резюме для скрининга
 */
export interface ResumeScreeningData {
  /** Опыт работы */
  experience: string;

  /** Образование */
  education?: string;

  /** Навыки */
  skills?: string;

  /** Дата рождения (если известна) — для контекста оценки карьеры */
  birthDate?: Date | string | null;
}

/**
 * Структурированные требования вакансии
 */
export interface VacancyRequirements {
  /** Название позиции */
  job_title: string;

  /** Краткое описание роли */
  summary: string;

  /** Обязательные требования */
  mandatory_requirements: string[];

  /** Желательные навыки */
  nice_to_have_skills: string[];

  /** Технологический стек */
  tech_stack: string[];

  /** Требования к опыту */
  experience_years: {
    min: number | null;
    description: string;
  };

  /** Языки */
  languages: Array<{
    language: string;
    level: string;
  }>;

  /** Тип локации */
  location_type: string;

  /** Ключевые слова для поиска */
  keywords_for_matching: string[];
}
