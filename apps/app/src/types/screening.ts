/**
 * Unified types for candidate screening and assessment system
 * Centralizes all type definitions for consistent data structures across components
 */

// ============================================
// SCORE TYPES
// ============================================

export type ScoreTheme = 'excellent' | 'good' | 'satisfactory' | 'poor' | 'muted';

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
  | 'growth' 
  | 'stable' 
  | 'decline' 
  | 'jump' 
  | 'role_change' 
  | null;

export interface ScreeningData extends ScreeningScore, ScreeningAnalysis, HiddenFitData {
  careerTrajectoryType?: CareerTrajectoryType;
  psychometricAnalysis?: ScreeningPsychometricAnalysis | null;
}

// ============================================
// INTERVIEW TYPES
// ============================================

export interface InterviewMessage {
  id: string;
  sender: 'CANDIDATE' | 'BOT' | 'ADMIN';
  contentType: 'TEXT' | 'VOICE';
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
  | 'HIGHLY_RECOMMENDED'
  | 'RECOMMENDED'
  | 'NEUTRAL'
  | 'NOT_RECOMMENDED'
  | 'hire'
  | 'maybe'
  | 'pass';

export interface RiskFactor {
  description: string;
  severity?: 'low' | 'medium' | 'high';
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
// ============================================

export interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  label: string;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export interface ItemsListProps {
  items: string[];
  type: 'strengths' | 'weaknesses' | 'risks' | 'recommendations' | 'questions';
  icon?: boolean;
  className?: string;
}

export interface AnalysisSection {
  id: string;
  title: string;
  content: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface AnalysisSectionsProps {
  sections: AnalysisSection[];
}
