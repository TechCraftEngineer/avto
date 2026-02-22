import { chat } from "./chat";
import { configureRules } from "./configure-rules";
import { approveAction, executeAction, undoAction } from "./execute-action";
import { feedback } from "./feedback";
import { getInterviewQuestions } from "./get-interview-questions";
import { getPriority } from "./get-priority";
import {
  getAuditLog,
  getPendingApprovals,
  getRecommendations,
  getUndoableActions,
} from "./get-recommendations";

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
};
