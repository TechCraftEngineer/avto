/**
 * Recruiter Agent Router
 *
 * tRPC router для AI-ассистента рекрутера
 * Предоставляет API для:
 * - chat: диалог с агентом (streaming)
 * - executeAction: выполнение действий
 * - getRecommendations: получение рекомендаций
 * - configureRules: настройка правил автоматизации
 * - feedback: отправка обратной связи
 */

import type { TRPCRouterRecord } from "@trpc/server";

import { chat } from "./chat";
import { configureRules } from "./configure-rules";
import { approveAction, executeAction, undoAction } from "./execute-action";
import { feedback } from "./feedback";
import {
  getAuditLog,
  getPendingApprovals,
  getRecommendations,
  getUndoableActions,
} from "./get-recommendations";
import { getInterviewQuestions } from "./get-interview-questions";
import { getPriority } from "./get-priority";

export const recruiterAgentRouter = {
  // Chat (streaming)
  chat,

  // Actions
  executeAction,
  undoAction,
  approveAction,

  // Recommendations
  getRecommendations,
  getPendingApprovals,
  getUndoableActions,
  getAuditLog,

  // Priority & Interview Questions
  getPriority,
  getInterviewQuestions,

  // Rules configuration
  configureRules,

  // Feedback
  feedback,
} satisfies TRPCRouterRecord;
