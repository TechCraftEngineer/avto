/**
 * Типы для оценки и скрининга кандидатов
 *
 * FitDecision — общий для screening и prequalification.
 * DimensionScore, EvaluationResult — для screening (dimensionScores array).
 * Prequalification использует свою структуру в db/schema/prequalification.
 */

export type FitDecision = "strong_fit" | "potential_fit" | "not_fit";

export type HonestyLevel = "direct" | "diplomatic" | "encouraging";

/** Для screening — массив оценок по измерениям */
export interface DimensionScore {
  dimension: string;
  score: number;
  reasoning: string;
}

/** Для screening — результат оценки с dimensionScores */
export interface EvaluationResult {
  fitScore: number;
  fitDecision: FitDecision;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  dimensionScores?: DimensionScore[];
}

export type ScreeningRecommendation = "invite" | "reject" | "need_info";

export interface ScreeningResult {
  match_percentage: number;
  overallScore: number;
  detailedScore?: number;
  analysis?: string;
  recommendation?: ScreeningRecommendation;
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
  recommendationUI?:
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "NEUTRAL"
    | "NOT_RECOMMENDED";
}

export interface ScreeningDataForRecommendation {
  score: number;
  detailedScore: number;
  analysis?: string;
  strengths?: string[];
  concerns?: string[];
}

export interface PrequalificationResult {
  sessionId: string;
  fitDecision: FitDecision;
  fitScore: number;
  feedback: string;
  canProceed: boolean;
}
