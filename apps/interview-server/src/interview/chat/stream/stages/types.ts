/**
 * Идентификаторы стадий интервью
 */
export type StageId =
  | "intro"
  | "org"
  | "tech"
  | "wrapup"
  | "profile_review" // Только для gig
  | "task_approach" // Только для gig
  | "motivation"; // Только для vacancy

/**
 * Массив всех валидных стадий для runtime проверки
 */
export const VALID_STAGES: readonly StageId[] = [
  "intro",
  "org",
  "tech",
  "motivation",
  "wrapup",
  "profile_review",
  "task_approach",
] as const;

/**
 * Конфигурация стадии интервью
 */
export interface InterviewStageConfig {
  /** Уникальный идентификатор стадии */
  id: StageId;

  /** Порядковый номер стадии */
  order: number;

  /** Описание стадии */
  description: string;

  /** Список разрешенных инструментов для этой стадии */
  allowedTools: string[];

  /** Максимальное количество вопросов на этой стадии */
  maxQuestions: number;

  /** Автоматически переходить к следующей стадии при достижении maxQuestions */
  autoAdvance: boolean;

  /** Действия выполняемые при входе в стадию */
  entryActions: StageAction[];
}

/**
 * Действия которые могут быть выполнены при входе в стадию
 */
export type StageAction =
  | "welcome"
  | "analyze_profile"
  | "final_question"
  | "check_bot_detection";

/**
 * Контекст стадии
 */
export interface StageContext {
  currentStage: StageId;
  previousStage?: StageId;
  questionCount: number;
  timeInStage: number;
  lastBotWarning?: string;
}

/**
 * Результат проверки перехода между стадиями
 */
export interface StageTransitionResult {
  canTransition: boolean;
  shouldTransition: boolean;
  nextStage?: StageId;
  reason?: string;
}
