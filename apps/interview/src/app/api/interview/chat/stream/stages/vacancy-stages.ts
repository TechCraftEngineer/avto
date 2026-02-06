import type { InterviewStageConfig } from "./types";

/**
 * Стадии интервью для вакансий
 * Включает специфичную стадию: motivation
 */
export const vacancyStages: InterviewStageConfig[] = [
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
    id: "org",
    order: 1,
    description: "Организационные вопросы (фокус на трудоустройство)",
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
    order: 2,
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
    maxQuestions: 3,
    autoAdvance: true,
    entryActions: [],
  },
  {
    id: "motivation",
    order: 3,
    description: "Оценка мотивации и соответствия",
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
    order: 4,
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
