import type { InterviewStageConfig } from "./types";

/**
 * Стадии интервью для разовых заданий (gig)
 * Включает специфичные стадии: profile_review и task_approach
 */
export const gigStages: InterviewStageConfig[] = [
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
    maxQuestions: 1,
    autoAdvance: true,
    entryActions: ["welcome"],
  },
  {
    id: "profile_review",
    order: 1,
    description: "Анализ профиля кандидата с платформы",
    allowedTools: [
      "getInterviewSettings",
      "getInterviewPolicy",
      "getInterviewState",
      "getInterviewProfile",
      "saveInterviewNote",
    ],
    maxQuestions: 0,
    autoAdvance: true,
    entryActions: ["analyze_profile"],
  },
  {
    id: "org",
    order: 2,
    description: "Организационные вопросы (специфичные для gig)",
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
    maxQuestions: 4,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "tech",
    order: 3,
    description: "Технические вопросы",
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
    maxQuestions: 2,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "task_approach",
    order: 4,
    description: "Обсуждение подхода к конкретной задаче",
    allowedTools: [
      "getInterviewSettings",
      "getInterviewState",
      "updateInterviewState",
      "saveQuestionAnswer",
      "saveInterviewNote",
    ],
    maxQuestions: 1,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "wrapup",
    order: 5,
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
