/**
 * Типы для оценки и скрининга кандидатов
 */

/**
 * Решение о соответствии кандидата
 */
export type FitDecision = "strong_fit" | "potential_fit" | "not_fit";

/**
 * Уровень честности в обратной связи
 */
export type HonestyLevel = "direct" | "diplomatic" | "encouraging";

/**
 * Результат оценки кандидата
 */
export interface EvaluationResult {
  fitScore: number; // 0-100
  fitDecision: FitDecision;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  dimensionScores?: DimensionScore[];
}

/**
 * Оценка по отдельному измерению
 */
export interface DimensionScore {
  dimension: string;
  score: number; // 0-100
  reasoning: string;
}

/**
 * Результат скрининга
 */
export interface ScreeningResult {
  match_percentage: number; // 0-100
  overallScore: number;
  detailedScore?: number;
  analysis?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "NEUTRAL" | "NOT_RECOMMENDED";
}

/**
 * Данные скрининга для рекомендации
 */
export interface ScreeningDataForRecommendation {
  score: number;
  detailedScore: number;
  analysis?: string;
  strengths?: string[];
  concerns?: string[];
}

/**
 * Результат преквалификации
 */
export interface PrequalificationResult {
  sessionId: string;
  fitDecision: FitDecision;
  fitScore: number;
  feedback: string;
  canProceed: boolean;
}
