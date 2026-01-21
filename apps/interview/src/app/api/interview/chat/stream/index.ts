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
    getInterviewState: createGetInterviewStateTool(sessionId),
    updateInterviewState: createUpdateInterviewStateTool(sessionId),
    getInterviewPolicy: createGetInterviewPolicyTool(entityType),
    getInterviewQuestionBank: createGetInterviewQuestionBankTool(
      model,
      sessionId,
      gig,
      vacancy,
      entityType,
    ),
    getScoringRubric: createGetScoringRubricTool(sessionId, entityType),
    getInterviewProfile: createGetInterviewProfileTool(sessionId, db),
    saveInterviewNote: createSaveInterviewNoteTool(sessionId),
    saveQuestionAnswer: createSaveQuestionAnswerTool(sessionId),
    analyzeResponseAuthenticity: createAnalyzeResponseAuthenticityTool(
      sessionId,
      model,
    ),
    getBotDetectionSummary: createGetBotDetectionSummaryTool(sessionId, model),
    completeInterview: createCompleteInterviewTool(sessionId),
  };

  const systemPrompt = createSystemPrompt(entityType, isFirstResponse);

  return {
    tools,
    systemPrompt,
  };
}
