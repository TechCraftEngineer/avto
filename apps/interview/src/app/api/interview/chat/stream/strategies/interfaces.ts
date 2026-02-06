/**
 * Strategy Pattern Interfaces for Interview Flows
 *
 * Defines the core interfaces for entity-specific interview strategies
 * (Gig vs Vacancy) following the Strategy pattern architecture.
 */

import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel, ToolSet } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { GigLike, VacancyLike } from "../types";

// ============================================================================
// Core Types
// ============================================================================

export type EntityType = "gig" | "vacancy" | "unknown";

export type GigInterviewStage =
  | "intro"
  | "profile_review"
  | "org"
  | "tech"
  | "task_approach"
  | "wrapup";

export type VacancyInterviewStage =
  | "intro"
  | "org"
  | "tech"
  | "motivation"
  | "wrapup";

export type InterviewStage = GigInterviewStage | VacancyInterviewStage;

// ============================================================================
// Stage Configuration
// ============================================================================

export interface StageConfig {
  readonly allowedTools: readonly string[];
  readonly maxQuestions: number;
  readonly autoAdvance: boolean;
  readonly minResponseLength: number;
  readonly transitionCondition?: "question_count" | "tool_call" | "manual";
}

// ============================================================================
// Interview Context
// ============================================================================

export interface BotSettings {
  botName?: string;
  botRole?: string;
  companyName?: string;
}

export interface InterviewContextBase {
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly candidateName: string;
  readonly botSettings: BotSettings;
  readonly customInstructions?: string;
}

// ============================================================================
// Gig-Specific Types
// ============================================================================

export interface GigInterviewContext extends InterviewContextBase {
  readonly entityType: "gig";
  readonly gig: GigDetails;
  readonly profileData?: FreelancerProfileData;
}

export interface GigDetails {
  id: string;
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
}

export interface FreelancerProfileData {
  id: string;
  name?: string | null;
  title?: string | null;
  rating?: number | null;
  completedGigs?: number | null;
  skills?: string[];
  hourlyRate?: number | null;
  bio?: string | null;
  workExperience?: WorkExperience[];
  education?: Education[];
}

export interface WorkExperience {
  id: string;
  company?: string | null;
  position?: string | null;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface Education {
  id: string;
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
  graduationYear?: number | null;
}

export interface GigScoringOutput {
  readonly score: number; // 0-100
  readonly recommendation:
    | "strong_hire"
    | "hire"
    | "maybe"
    | "no_hire"
    | "strong_no_hire";
  readonly strengths: string[];
  readonly weaknesses: string[];
  readonly expertiseDepth: number; // 1-5
  readonly problemSolving: number; // 1-5
  readonly communication: number; // 1-5
  readonly timelineRealism: number; // 1-5
  readonly authenticityScore: number; // 0-100
  readonly redFlags: string[];
  readonly nextSteps: string[];
}

// ============================================================================
// Vacancy-Specific Types
// ============================================================================

export interface VacancyInterviewContext extends InterviewContextBase {
  readonly entityType: "vacancy";
  readonly vacancy: VacancyDetails;
}

export interface VacancyDetails {
  id: string;
  title?: string | null;
  description?: string | null;
  region?: string | null;
  workLocation?: string | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
}

export interface VacancyScoringOutput {
  readonly score: number; // 0-100
  readonly recommendation:
    | "strong_hire"
    | "hire"
    | "maybe"
    | "no_hire"
    | "strong_no_hire";
  readonly completeness: number; // 1-5
  readonly relevance: number; // 1-5
  readonly motivation: number; // 1-5
  readonly communication: number; // 1-5
  readonly authenticityScore: number; // 0-100
  readonly concerns: string[];
  readonly recommendationNotes: string;
}

// ============================================================================
// Union Types
// ============================================================================

export type InterviewContext = GigInterviewContext | VacancyInterviewContext;

export type ScoringOutput = GigScoringOutput | VacancyScoringOutput;

// ============================================================================
// Scoring Rubric
// ============================================================================

export interface ScoringRubric {
  readonly version: string;
  readonly criteria: ScoringCriterion[];
  readonly weights: Record<string, number>;
  readonly authenticityPenalty: boolean;
}

export interface ScoringCriterion {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly maxScore: number;
}

// ============================================================================
// Welcome Message
// ============================================================================

export interface WelcomeMessageConfig {
  readonly title: string;
  readonly subtitle: string;
  readonly placeholder: string;
  readonly greeting: string;
  readonly suggestedQuestions?: string[];
}

// ============================================================================
// Completion Criteria
// ============================================================================

export interface CompletionCriteria {
  readonly minQuestions: number;
  readonly requiredStages: readonly string[];
  readonly maxDurationMinutes?: number;
}

// ============================================================================
// Core Strategy Interface
// ============================================================================

export interface InterviewStrategy {
  /** Entity type this strategy handles */
  readonly entityType: EntityType;

  /** Available stages for this entity type */
  readonly stages: readonly InterviewStage[];

  /** Get stage configuration */
  getStageConfig(stage: InterviewStage): StageConfig;

  /** Build system prompt for current context */
  getSystemPrompt(context: InterviewContext, isFirstResponse: boolean): string;

  /** Get welcome message for candidate */
  getWelcomeMessage(context: InterviewContext): WelcomeMessageConfig;

  /** Get scoring rubric for evaluation */
  getScoringRubric(context: InterviewContext): ScoringRubric;

  /** Create tool factory for current context */
  createToolFactory(
    context: InterviewContext,
    model: LanguageModel,
    sessionId: string,
    db: NodePgDatabase<typeof schema>,
  ): ToolFactory;

  /** Determine if stage should advance */
  shouldAdvanceStage(
    currentStage: InterviewStage,
    response: string,
    context: InterviewContext,
  ): boolean;

  /** Get completion criteria */
  getCompletionCriteria(context: InterviewContext): CompletionCriteria;
}

// ============================================================================
// Tool Factory Interface
// ============================================================================

export interface ToolFactory {
  /** Create tool set for the strategy */
  createTools(): ToolSet;

  /** Get available tools for a specific stage */
  getAvailableTools(stage: InterviewStage): string[];

  /** Check if a tool is available for a stage */
  isToolAvailable(toolName: string, stage: InterviewStage): boolean;
}

// ============================================================================
// Transition Context
// ============================================================================

export interface TransitionContext {
  askedQuestions: string[];
  userResponses: string[];
  botDetectionScore?: number;
  timeInCurrentStage?: number;
}
