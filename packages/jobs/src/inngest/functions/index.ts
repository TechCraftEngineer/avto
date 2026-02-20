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

import {
  fetchActiveListFunction,
  fetchArchivedListFunction,
  importArchivedVacanciesFunction,
  refreshAllResumesFunction,
  refreshSingleResumeFunction,
  updateSingleVacancyFunction,
  verifyHHCredentialsFunction,
  verifyKworkCredentialsFunction,
} from "@qbs-autonaim/jobs-parsers";
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
import {
  evaluateGigResponseFunction,
  importGigByUrlFunction,
  importNewGigsFunction,
  kworkChatImportHistoryFunction,
  kworkChatProcessFunction,
  syncGigResponses,
} from "./gig";
import {
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
} from "./interview";
import {
  analyzeSingleResponseFunction,
  generateGigRecommendationFunction,
  generateRecommendationFunction,
  generateVacancyRecommendationFunction,
  parseSingleResumeFunction,
  recalculateGigShortlistFunction,
  recalculateRankingFunction,
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
  importSelectedArchivedVacanciesFunction,
  importSelectedNewVacanciesFunction,
  importVacancyByUrlFunction,
  refreshVacancyResponsesFunction,
  syncArchivedVacancyResponsesFunction,
} from "./vacancy";
import {
  webCompleteInterviewFunction,
  webSendQuestionFunction,
} from "./web-interview";

// biome-ignore lint/suspicious/noExplicitAny: Complex Inngest function types exceed TypeScript serialization limits
export const inngestFunctions: any[] = [
  // Vacancy
  collectChatIdsFunction,
  extractVacancyRequirementsFunction,
  fetchActiveListFunction,
  fetchArchivedListFunction,
  importArchivedVacanciesFunction,
  importSelectedArchivedVacanciesFunction,
  importSelectedNewVacanciesFunction,
  importVacancyByUrlFunction,
  refreshVacancyResponsesFunction,
  syncArchivedVacancyResponsesFunction,
  updateSingleVacancyFunction,
  // Response
  analyzeSingleResponseFunction,
  generateRecommendationFunction,
  generateVacancyRecommendationFunction,
  generateGigRecommendationFunction,
  parseSingleResumeFunction,
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
  importGigByUrlFunction,
  importNewGigsFunction,
  kworkChatImportHistoryFunction,
  kworkChatProcessFunction,
  syncGigResponses,
  // Integration
  verifyHHCredentialsFunction,
  verifyKworkCredentialsFunction,
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
