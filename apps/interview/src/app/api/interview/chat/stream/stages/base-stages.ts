import type { InterviewStageConfig } from "./types";

/**
 * Базовые стадии интервью, общие для всех типов сущностей
 */
export const baseStages: InterviewStageConfig[] = [
  {
    id: "intro",
    order: 0,
    description: "Введение и приветствие",
    allowedTools: [
      "getInterviewSettings",
      "getInterviewPolicy",
      "getInterviewState",
      "getScoringRubric",
      "getInterviewQuestionBank",
    ],
    maxQuestions: 2,
    autoAdvance: true,
    entryActions: ["welcome"],
  },
  {
    id: "org",
    order: 1,
    description: "Организационные вопросы",
    allowedTools: [
      "getInterviewSettings",
      "getInterviewPolicy",
      "getInterviewState",
      "updateInterviewState",
      "getInterviewQuestionBank",
      "saveQuestionAnswer",
      "analyzeResponseAuthenticity",
      "saveInterviewNote",
    ],
    maxQuestions: 5,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "tech",
    order: 2,
    description: "Технические вопросы / оценка навыков",
    allowedTools: [
      "getInterviewSettings",
      "getInterviewPolicy",
      "getInterviewState",
      "updateInterviewState",
      "getInterviewQuestionBank",
      "saveQuestionAnswer",
      "analyzeResponseAuthenticity",
      "saveInterviewNote",
    ],
    maxQuestions: 3,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "wrapup",
    order: 3,
    description: "Завершение и финальные вопросы",
    allowedTools: [
      "getInterviewState",
      "updateInterviewState",
      "getBotDetectionSummary",
      "saveInterviewNote",
      "completeInterview",
    ],
    maxQuestions: 1,
    autoAdvance: false,
    entryActions: ["final_question"],
  },
];
