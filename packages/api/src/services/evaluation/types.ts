/**
 * Evaluation Service Types
 *
 * Типы для сервиса оценки соответствия кандидатов вакансиям.
 * Основные типы данных реэкспортируются из схемы БД для обеспечения консистентности.
 */

// Re-export core types from DB schema for consistency
export type {
  DimensionScore,
  EvaluationResult,
  FitDecision,
  HonestyLevel,
  ParsedResume,
} from "@qbs-autonaim/db";

import type { FitDecision, HonestyLevel, ParsedResume } from "@qbs-autonaim/db";
import type { DialogueMessage, VacancyData } from "./shared-types";

/**
 * Входные данные для оценки кандидата
 */
export interface EvaluationInput {
  /** Распарсенное резюме кандидата */
  parsedResume: ParsedResume;
  /** История диалога с кандидатом */
  dialogueHistory: DialogueMessage[];
  /** Данные вакансии */
  vacancy: VacancyData;
  /** Конфигурация workspace для оценки */
  workspaceConfig: WorkspaceEvaluationConfig;
}

/** Реэкспорт общих типов для обратной совместимости */
export type { DialogueMessage, VacancyData };
/** Реэкспорт из @qbs-autonaim/types для обратной совместимости */
export type { VacancyRequirements } from "@qbs-autonaim/types";

/**
 * Конфигурация оценки для workspace
 */
export interface WorkspaceEvaluationConfig {
  /** Порог прохождения (0-100) */
  passThreshold: number;
  /** Обязательные вопросы */
  mandatoryQuestions: string[];
  /** Тон общения */
  tone: "formal" | "friendly";
  /** Уровень честности в обратной связи */
  honestyLevel: HonestyLevel;
}

/**
 * Конфигурация для генерации обратной связи
 */
export interface FeedbackConfig {
  /** Уровень честности */
  honestyLevel: HonestyLevel;
  /** Тон общения */
  tone: "formal" | "friendly";
  /** Решение о соответствии */
  fitDecision: FitDecision;
  /** Оценка соответствия */
  fitScore: number;
  /** Название вакансии */
  vacancyTitle: string;
}

/**
 * Коды ошибок сервиса оценки
 */
export type EvaluationErrorCode =
  | "INSUFFICIENT_DATA"
  | "AI_SERVICE_ERROR"
  | "INVALID_EVALUATION_RESULT"
  | "FEEDBACK_GENERATION_FAILED";

/**
 * Ошибка сервиса оценки
 */
export class EvaluationError extends Error {
  readonly code: EvaluationErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: EvaluationErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "EvaluationError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}
