import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel, ToolSet } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ZodType } from "zod";
// SystemPromptBuilder импортируется только для использования в интерфейсе InterviewStrategy
import type { SystemPromptBuilder } from "../prompts/types";
import type { InterviewStageConfig } from "../stages/types";

/**
 * Поддерживаемые типы сущностей для интервью
 */
export type SupportedEntityType = "gig" | "vacancy" | "project";

/**
 * Конфигурация приветственного сообщения для типа сущности
 */
export interface WelcomeMessageConfig {
  title: string;
  subtitle: string;
  placeholder: string;
  greeting: string;
  suggestedQuestions?: string[];
}

/**
 * Конфигурация карточки контекста для типа сущности
 */
export interface ContextCardConfig {
  badgeLabel: string;
  fields: ContextField[];
  expandableFields?: ContextField[];
}

export interface ContextField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "array" | "currency";
  showFor: SupportedEntityType[];
}

/**
 * Конфигурация перехода между стадиями
 */
export interface StageTransitionConfig {
  from: string;
  to: string;
  condition: "auto" | "question_count" | "tool_call";
  params?: Record<string, unknown>;
}

/**
 * Конфигурация схемы оценки
 */
export interface ScoringConfig {
  schema: ZodType;
  version: string;
  includesAuthenticityPenalty: boolean;
}

/**
 * Контекст для валидации перехода между стадиями
 */
export interface TransitionContext {
  askedQuestions: string[];
  userResponses: string[];
  botDetectionScore?: number;
  timeInCurrentStage?: number;
}

/**
 * Состояние интервью из метаданных
 */
export interface InterviewState {
  stage: string;
  askedQuestions: string[];
  voiceOptionOffered: boolean;
  questionCount: number;
}

/**
 * Результат банка вопросов
 */
export interface QuestionBankResult {
  organizational: string[];
  technical: string[];
  asked: string[];
}

/**
 * Интерфейс фабрики инструментов
 */
export interface ToolFactory {
  create(
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
  ): ToolSet;

  getAvailableTools(stage: string): string[];

  isToolAvailable(toolName: string, stage: string): boolean;
}

/**
 * Конфигурация банка вопросов
 */
export interface QuestionBankConfig {
  organizationalDefaults: string[];
  technicalDefaults: string[];
  customQuestionsField: string;
}

/**
 * Branded тип для Gig сущности
 */
export type GigLike = {
  id?: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  estimatedDuration?: string | null;
  deadline?: Date | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
} & { __brand?: "gig" };

/**
 * Branded тип для Vacancy сущности
 */
export type VacancyLike = {
  id?: string;
  title?: string | null;
  description?: string | null;
  region?: string | null;
  workLocation?: string | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
} & { __brand?: "vacancy" };

/**
 * Настройки бота
 */
export type BotSettings = {
  botName?: string;
  botRole?: string;
  companyName?: string;
};

/**
 * Облегченный контекст интервью
 */
export type InterviewContextLite = {
  botSettings?: BotSettings;
  candidateName?: string | null;
};

/**
 * Главный интерфейс стратегии интервью
 */
export interface InterviewStrategy {
  /** Тип сущности которую обрабатывает эта стратегия */
  readonly entityType: SupportedEntityType;

  /** Доступные стадии для этого типа сущности */
  readonly stages: InterviewStageConfig[];

  /** Правила переходов между стадиями */
  readonly stageTransitions: StageTransitionConfig[];

  /** Построитель системных промптов для этой сущности */
  readonly systemPromptBuilder: SystemPromptBuilder;

  /** Фабрика инструментов для этой сущности */
  readonly toolFactory: ToolFactory;

  /** Конфигурация банка вопросов */
  readonly questionBank: QuestionBankConfig;

  /** Конфигурация оценки */
  readonly scoring: ScoringConfig;

  /** Получить конфигурацию приветственного сообщения */
  getWelcomeMessage(): WelcomeMessageConfig;

  /** Получить конфигурацию карточки контекста */
  getContextCardData(entity: GigLike | VacancyLike): ContextCardConfig;

  /** Создать набор инструментов для текущей стадии */
  createTools(
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
    gig: GigLike | null,
    vacancy: VacancyLike | null,
    interviewContext: InterviewContextLite,
    currentStage: string,
  ): ToolSet;

  /** Создать схему оценки */
  createScoringSchema(): ZodType;

  /** Проверить возможность перехода между стадиями */
  canTransition(from: string, to: string, context: TransitionContext): boolean;

  /** Получить следующий вопрос на основе текущего состояния */
  getNextQuestion(
    questionBank: QuestionBankResult,
    interviewState: InterviewState,
  ): string | null;
}
