/**
 * Типы для оценки и скрининга кандидатов
 */

export type FitDecision = "strong_fit" | "potential_fit" | "not_fit";

export type HonestyLevel = "direct" | "diplomatic" | "encouraging";

export interface DimensionScore {
  dimension: string;
  score: number;
  reasoning: string;
}

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
