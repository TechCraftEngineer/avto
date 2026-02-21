/**
 * Prequalification Service Types
 *
 * Типы для сервиса преквалификации кандидатов.
 * Основные типы данных реэкспортируются из схемы БД для обеспечения консистентности.
 */

// Re-export core types from DB schema for consistency
export type {
  DimensionScore,
  EvaluationResult,
  FitDecision,
  ParsedResume,
  PrequalificationSession,
  PrequalificationSource,
  PrequalificationStatus,
} from "@qbs-autonaim/db";

/**
 * Входные данные для создания сессии преквалификации
 */
export interface CreateSessionInput {
  /** ID workspace (tenant) */
  workspaceId: string;
  /** ID вакансии */
  vacancyId: string;
  /** Согласие кандидата на обработку данных */
  candidateConsent: boolean;
  /** Источник сессии */
  source: "widget" | "direct";
  /** User Agent браузера (опционально) */
  userAgent?: string;
  /** IP адрес кандидата (опционально) */
  ipAddress?: string;
}

/**
 * Результат создания сессии
 */
export interface CreateSessionResult {
  /** ID созданной сессии */
  sessionId: string;
  /** Статус сессии */
  status: SessionStatus;
  /** Время истечения сессии */
  expiresAt: Date;
}

/**
 * Статусы сессии преквалификации
 */
export type SessionStatus =
  | "consent_pending"
  | "resume_pending"
  | "dialogue_active"
  | "evaluating"
  | "completed"
  | "submitted"
  | "expired";

/**
 * Допустимые переходы между статусами сессии
 * Ключ - текущий статус, значение - массив допустимых следующих статусов
 */
export const SESSION_STATUS_TRANSITIONS: Record<
  SessionStatus,
  SessionStatus[]
> = {
  consent_pending: ["resume_pending", "expired"],
  resume_pending: ["dialogue_active", "expired"],
  dialogue_active: ["evaluating", "expired"],
  evaluating: ["completed", "expired"],
  completed: ["submitted", "expired"],
  submitted: [], // Терминальный статус
  expired: [], // Терминальный статус
};

/**
 * Проверяет, является ли переход между статусами допустимым
 */
export function isValidStatusTransition(
  from: SessionStatus,
  to: SessionStatus,
): boolean {
  return SESSION_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Ответ AI ассистента
 */
export interface AIResponse {
  /** Текст ответа */
  message: string;
  /** Флаг завершения диалога */
  isComplete: boolean;
  /** Следующий вопрос (если есть) */
  nextQuestion?: string;
  /** Метаданные ответа */
  metadata?: Record<string, unknown>;
}

import type { DialogueMessage, VacancyData } from "../evaluation/shared-types";

/**
 * Входные данные для оценки кандидата
 */
export interface EvaluationInput {
  /** ID сессии */
  sessionId: string;
  /** Распарсенное резюме */
  parsedResume: import("@qbs-autonaim/db").ParsedResume;
  /** История диалога */
  dialogueHistory: DialogueMessage[];
  /** Данные вакансии */
  vacancy: VacancyData;
  /** Конфигурация workspace */
  workspaceConfig: WorkspacePrequalificationConfig;
}

/** Реэкспорт общих типов для обратной совместимости */
export type { DialogueMessage, VacancyData };

/**
 * Конфигурация преквалификации для workspace
 */
export interface WorkspacePrequalificationConfig {
  /** Порог прохождения (0-100) */
  passThreshold: number;
  /** Обязательные вопросы */
  mandatoryQuestions: string[];
  /** Тон общения */
  tone: "formal" | "friendly";
  /** Уровень честности в обратной связи */
  honestyLevel: "direct" | "diplomatic" | "encouraging";
  /** Максимальное количество сообщений в диалоге */
  maxDialogueTurns: number;
  /** Таймаут сессии в минутах */
  sessionTimeoutMinutes: number;
}

/**
 * Коды ошибок сервиса преквалификации
 */
export type PrequalificationErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "INVALID_STATE_TRANSITION"
  | "CONSENT_REQUIRED"
  | "TENANT_MISMATCH"
  | "VACANCY_NOT_FOUND"
  | "RESUME_REQUIRED"
  | "INSUFFICIENT_DIALOGUE"
  | "EVALUATION_FAILED"
  | "ALREADY_SUBMITTED"
  | "CONVERSATION_CREATION_FAILED"
  | "INTERVIEW_SESSION_CREATION_FAILED";

/**
 * Ошибка сервиса преквалификации
 */
export class PrequalificationError extends Error {
  readonly code: PrequalificationErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PrequalificationErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "PrequalificationError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Входные данные для загрузки резюме
 */
export interface UploadResumeInput {
  /** ID сессии */
  sessionId: string;
  /** Содержимое файла */
  fileContent: Buffer;
  /** Тип файла */
  fileType: "pdf" | "docx";
  /** Имя файла (опционально) */
  filename?: string;
}

/**
 * Результат загрузки резюме
 */
export interface UploadResumeResult {
  /** Успешность загрузки */
  success: boolean;
  /** Распарсенное резюме */
  parsedResume: import("@qbs-autonaim/db").ParsedResume;
  /** Новый статус сессии */
  newStatus: SessionStatus;
}

/**
 * Входные данные для отправки сообщения
 */
export interface SendMessageInput {
  /** ID сессии */
  sessionId: string;
  /** Текст сообщения от кандидата */
  message: string;
}

/**
 * Результат отправки сообщения
 */
export interface SendMessageResult {
  /** Ответ AI */
  response: AIResponse;
  /** Текущий статус сессии */
  status: SessionStatus;
  /** Флаг завершения диалога */
  dialogueComplete: boolean;
}

/**
 * Результат преквалификации для кандидата
 */
export interface PrequalificationResult {
  /** ID сессии */
  sessionId: string;
  /** Решение о соответствии */
  fitDecision: "strong_fit" | "potential_fit" | "not_fit";
  /** Оценка соответствия (0-100) */
  fitScore: number;
  /** Обратная связь для кандидата */
  feedback: string;
  /** Может ли кандидат продолжить подачу заявки */
  canProceed: boolean;
}
