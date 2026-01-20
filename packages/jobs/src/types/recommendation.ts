/**
 * Типы для системы рекомендаций по кандидатам
 */

import type { CandidateRecommendation } from "@qbs-autonaim/ai";

/**
 * Тип сущности для рекомендации
 */
export type RecommendationEntityType = "vacancy" | "gig";

/**
 * Входные данные для генерации рекомендации
 */
export interface RecommendationInput {
  /** ID отклика */
  responseId: string;

  /** Тип сущности */
  entityType: RecommendationEntityType;

  /** ID сущности (вакансия или gig) */
  entityId: string;
}

/**
 * Результат генерации рекомендации
 */
export interface RecommendationGenerationResult {
  /** Успешность генерации */
  success: boolean;

  /** Сгенерированная рекомендация */
  recommendation?: CandidateRecommendation;

  /** Ошибка при генерации */
  error?: string;

  /** ID отклика */
  responseId: string;
}

/**
 * Данные для сохранения рекомендации в БД
 */
export interface RecommendationSaveData {
  /** ID отклика */
  responseId: string;

  /** Уровень рекомендации */
  recommendation:
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "NEUTRAL"
    | "NOT_RECOMMENDED";

  /** Сильные стороны */
  strengths: string[];

  /** Слабые стороны */
  weaknesses: string[];

  /** Краткое резюме кандидата */
  candidateSummary: string;

  /** Анализ для ранжирования */
  rankingAnalysis?: string;
}

/**
 * Контекст для отправки рекомендации в Telegram
 */
export interface RecommendationTelegramContext {
  /** ID чата */
  chatId: number | string;

  /** Имя кандидата */
  candidateName: string | null;

  /** Название позиции */
  entityTitle: string;

  /** Рекомендация */
  recommendation: CandidateRecommendation;

  /** ID отклика для callback */
  responseId: string;
}
