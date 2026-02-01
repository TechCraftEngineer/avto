import type * as schema from "@qbs-autonaim/db/schema";
import type { LanguageModel } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type { LanguageModel };

export type EntityType = "gig" | "vacancy" | "unknown";

export type InterviewStage = "intro" | "org" | "tech" | "wrapup";

export type BotSettings = {
  botName?: string;
  botRole?: string;
  companyName?: string;
};

export type InterviewContextLite = {
  botSettings?: BotSettings;
  candidateName?: string | null;
};

export type GigLike = {
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
};

export type VacancyLike = {
  title?: string | null;
  description?: string | null;
  region?: string | null;
  workLocation?: string | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
};

export type InterviewRuntimeParams = {
  model: LanguageModel;
  sessionId: string;
  db: NodePgDatabase<typeof schema>;
  gig: GigLike | null;
  vacancy: VacancyLike | null;
  interviewContext: InterviewContextLite;
  isFirstResponse: boolean;
};
