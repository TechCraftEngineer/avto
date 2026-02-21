/**
 * Unified types for candidate screening and assessment system
 * Centralizes all type definitions for consistent data structures across components
 */

import type { ComponentType, ReactNode } from "react";

// ============================================
// SCORE TYPES
// ============================================

export type ScoreTheme =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "muted";

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  SATISFACTORY: 40,
} as const;

export type ScoreScale = {
  divisor: number;
  multiplier: number;
  max: number;
};

export const SCORE_SCALES = {
  FIVE_POINT: { divisor: 5, multiplier: 100, max: 5 } as ScoreScale,
  HUNDRED_POINT: { divisor: 1, multiplier: 1, max: 100 } as ScoreScale,
} as const;

// ============================================
// SCREENING TYPES
// ============================================

export interface ScreeningScore {
  score: number;
  detailedScore: number;
  potentialScore?: number | null;
  careerTrajectoryScore?: number | null;
}

export interface ScreeningAnalysis {
  analysis?: string | null;
  priceAnalysis?: string | null;
  deliveryAnalysis?: string | null;
  potentialAnalysis?: string | null;
  careerTrajectoryAnalysis?: string | null;
  hiddenFitAnalysis?: string | null;
  interviewQuestions?: string[] | null;
}

export interface HiddenFitData {
  indicators?: string[] | null;
  hiddenFitIndicators?: string[] | null;
}

export interface ScreeningPsychometricAnalysis {
  compatibilityScore: number;
  summary: string | null;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
}

export type CareerTrajectoryType =
  | "growth"
  | "stable"
  | "decline"
  | "jump"
  | "role_change"
  | null;

export interface ScreeningData
  extends ScreeningScore,
    ScreeningAnalysis,
    HiddenFitData {
  careerTrajectoryType?: CareerTrajectoryType;
  psychometricAnalysis?: ScreeningPsychometricAnalysis | null;
}

// ============================================
// INTERVIEW TYPES
// ============================================

export interface InterviewMessage {
  id: string;
  sender: "CANDIDATE" | "BOT" | "ADMIN";
  contentType: "TEXT" | "VOICE";
  content: string;
  voiceUrl?: string;
  voiceDuration?: string;
  voiceTranscription?: string;
  createdAt: Date | string;
}

export interface InterviewScoring {
  score: number;
  detailedScore?: number;
  analysis?: string | null;
  botUsageDetected?: number | null;
}

export interface InterviewConversation {
  interviewScoring?: InterviewScoring;
  messages?: InterviewMessage[];
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export type RecommendationLevel =
  | "HIGHLY_RECOMMENDED"
  | "RECOMMENDED"
  | "NEUTRAL"
  | "NOT_RECOMMENDED"
  | "hire"
  | "maybe"
  | "pass";

export interface RiskFactor {
  description: string;
  severity?: "low" | "medium" | "high";
}

export interface CandidateRecommendation {
  recommendation: RecommendationLevel;
  candidateSummary: string;
  strengths: string[];
  weaknesses?: string[];
  riskFactors?: RiskFactor[];
  interviewQuestions?: string[];
  actionSuggestions?: string[];
}

// ============================================
// ASSESSMENT TYPES (for Overall Assessment)
// ============================================

export interface OverallAssessmentData {
  compositeScore: number | null;
  compositeReasoning: string | null;
  recommendation?: RecommendationLevel | null;
  strengths?: string[];
  weaknesses?: string[];
}

export interface FactorBreakdownData {
  experienceScore?: number | null;
  experienceReasoning?: string | null;
  skillsScore?: number | null;
  skillsReasoning?: string | null;
  risks?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

// ============================================
// UI COMPONENT PROP TYPES
// Централизованные типы для score-display и items-list
// ============================================

export interface ScoreDisplayProps {
  /** Score value to display */
  score: number | null;
  /** Maximum score value */
  maxScore?: number;
  /** Label for the score */
  label: string | ReactNode;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show badge (optional, for future use) */
  showBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

export type ItemsListType =
  | "strengths"
  | "weaknesses"
  | "risks"
  | "recommendations"
  | "questions"
  | "challenges";

export interface ItemsListProps {
  /** List of items to display */
  items: string[];
  /** Type of list determines colors and icons */
  type: ItemsListType;
  /** Whether to show icons */
  icon?: boolean;
  /** Whether to show items as badges */
  asBadges?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface ScoreDisplayGridProps {
  scores: Array<{
    score: number | null;
    maxScore?: number;
    label: string;
  }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export interface AnalysisSection {
  id: string;
  title: string;
  content: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string;
}

export interface AnalysisSectionsProps {
  sections: AnalysisSection[];
}
