import { createSystemPrompt } from "./prompts";
import {
  createAnalyzeResponseAuthenticityTool,
  createCompleteInterviewTool,
  createGetBotDetectionSummaryTool,
  createGetInterviewPolicyTool,
  createGetInterviewProfileTool,
  createGetInterviewQuestionBankTool,
  createGetInterviewSettingsTool,
  createGetInterviewStateTool,
  createGetScoringRubricTool,
  createSaveInterviewNoteTool,
  createSaveQuestionAnswerTool,
  createUpdateInterviewStateTool,
} from "./tools";
import type { EntityType, InterviewRuntimeParams } from "./types";

export type {
  BotSettings,
  EntityType,
  GigLike,
  InterviewContextLite,
  InterviewRuntimeParams,
  InterviewStage,
  VacancyLike,
} from "./types";

export function createWebInterviewRuntime(params: InterviewRuntimeParams) {
  const {
    model,
    sessionId,
    db,
    gig,
    vacancy,
    interviewContext,
    isFirstResponse,
  } = params;

  const entityType: EntityType = gig ? "gig" : vacancy ? "vacancy" : "unknown";

  const tools = {
    getInterviewSettings: createGetInterviewSettingsTool(
      gig,
      vacancy,
      interviewContext,
      entityType,
    ),
    getInterviewPolicy: createGetInterviewPolicyTool(entityType),
    getInterviewState: createGetInterviewStateTool(sessionId),
    updateInterviewState: createUpdateInterviewStateTool(sessionId),
    getInterviewQuestionBank: createGetInterviewQuestionBankTool(
      model,
      sessionId,
      gig,
      vacancy,
      entityType,
    ),
    getScoringRubric: createGetScoringRubricTool(sessionId, entityType),
    saveInterviewNote: createSaveInterviewNoteTool(sessionId),
    saveQuestionAnswer: createSaveQuestionAnswerTool(sessionId),
    analyzeResponseAuthenticity: createAnalyzeResponseAuthenticityTool(
      sessionId,
      model,
    ),
    getBotDetectionSummary: createGetBotDetectionSummaryTool(sessionId, model),
    completeInterview: createCompleteInterviewTool(sessionId),
  };

  if (entityType === "gig") {
    (
      tools as Record<string, ReturnType<typeof createGetInterviewProfileTool>>
    ).getInterviewProfile = createGetInterviewProfileTool(sessionId, db);
  }

  const systemPrompt = createSystemPrompt(entityType, isFirstResponse);

  return { tools, systemPrompt };
}
