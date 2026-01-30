/**
 * Centralized export for all Inngest functions
 */

// Candidate functions
export * from "./candidate";

// Draft functions
export * from "./draft";

// Freelance functions
export * from "./freelance";

// Gig functions
export * from "./gig";

// Integration functions
export * from "./integration";

// Interview functions
export * from "./interview";

// Response functions
export * from "./response";
// Telegram functions
export * from "./telegram";
// Vacancy functions
export * from "./vacancy";
// Web Interview functions
export * from "./web-interview";

import type { InngestFunction } from "inngest";
import {
  sendCandidateWelcomeBatchFunction,
  sendCandidateWelcomeFunction,
  sendOfferFunction,
} from "./candidate";
import { cleanupExpiredDraftsFunction } from "./draft";
import {
  analyzeFreelanceResponseFunction,
  generateFreelanceInvitationFunction,
  parseFreelanceProfileFunction,
  sendFreelanceNotificationFunction,
} from "./freelance";
import { evaluateGigResponseFunction, syncGigResponses } from "./gig";
import { verifyHHCredentialsFunction } from "./integration";
import {
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
} from "./interview";
import {
  generateRecommendationFunction,
  parseMissingContactsFunction,
  parseNewResumesFunction,
  recalculateGigShortlistFunction,
  recalculateRankingFunction,
  refreshAllResumesFunction,
  refreshSingleResumeFunction,
  screenAllResponsesFunction,
  screenNewResponsesFunction,
  screenResponseFunction,
  screenResponsesBatchFunction,
} from "./response";
import {
  analyzeInterviewFunction,
  completeInterviewFunction,
  notifyTelegramAuthErrorFunction,
  processIncomingMessageFunction,
  sendNextQuestionFunction,
  sendTelegramMessageByUsernameFunction,
  sendTelegramMessageFunction,
  transcribeVoiceFunction,
} from "./telegram";
// Re-export all functions as array for server registration
import {
  collectChatIdsFunction,
  extractVacancyRequirementsFunction,
  fetchArchivedListFunction,
  importArchivedVacanciesFunction,
  importNewVacanciesFunction,
  importSelectedArchivedVacanciesFunction,
  importVacancyByUrlFunction,
  refreshVacancyResponsesFunction,
  syncArchivedVacancyResponsesFunction,
  updateSingleVacancyFunction,
  updateVacanciesFunction,
} from "./vacancy";
import {
  webCompleteInterviewFunction,
  webSendQuestionFunction,
} from "./web-interview";

export const inngestFunctions: InngestFunction.Any[] = [
  // Vacancy
  collectChatIdsFunction,
  extractVacancyRequirementsFunction,
  fetchArchivedListFunction,
  importArchivedVacanciesFunction,
  importNewVacanciesFunction,
  importSelectedArchivedVacanciesFunction,
  importVacancyByUrlFunction,
  refreshVacancyResponsesFunction,
  syncArchivedVacancyResponsesFunction,
  updateSingleVacancyFunction,
  updateVacanciesFunction,
  // Response
  generateRecommendationFunction,
  parseMissingContactsFunction,
  parseNewResumesFunction,
  recalculateRankingFunction,
  recalculateGigShortlistFunction,
  refreshAllResumesFunction,
  refreshSingleResumeFunction,
  screenAllResponsesFunction,
  screenNewResponsesFunction,
  screenResponseFunction,
  screenResponsesBatchFunction,
  // Candidate
  sendCandidateWelcomeBatchFunction,
  sendCandidateWelcomeFunction,
  sendOfferFunction,
  // Draft
  cleanupExpiredDraftsFunction,
  // Freelance
  analyzeFreelanceResponseFunction,
  generateFreelanceInvitationFunction,
  parseFreelanceProfileFunction,
  sendFreelanceNotificationFunction,
  // Gig
  evaluateGigResponseFunction,
  syncGigResponses,
  // Integration
  verifyHHCredentialsFunction,
  // Interview
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
  // Telegram
  analyzeInterviewFunction,
  completeInterviewFunction,
  notifyTelegramAuthErrorFunction,
  processIncomingMessageFunction,
  sendNextQuestionFunction,
  sendTelegramMessageFunction,
  sendTelegramMessageByUsernameFunction,
  transcribeVoiceFunction,
  // Web Interview
  webCompleteInterviewFunction,
  webSendQuestionFunction,
];
