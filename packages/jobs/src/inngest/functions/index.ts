/**
 * Centralized export for all Inngest functions
 */

// Integration functions
export {
  refreshAllResumesFunction,
  refreshSingleResumeFunction,
  updateSingleVacancyFunction,
  verifyHHCredentialsFunction,
} from "@qbs-autonaim/jobs-parsers";
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
  refreshAllResumesFunction,
  refreshSingleResumeFunction,
  updateSingleVacancyFunction,
  verifyHHCredentialsFunction,
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
import { evaluateGigResponseFunction, syncGigResponses } from "./gig";
import {
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
} from "./interview";
import {
  generateGigRecommendationFunction,
  generateRecommendationFunction,
  generateVacancyRecommendationFunction,
  parseMissingContactsFunction,
  parseNewResumesFunction,
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
  fetchArchivedListFunction,
  importArchivedVacanciesFunction,
  importNewVacanciesFunction,
  importSelectedArchivedVacanciesFunction,
  importVacancyByUrlFunction,
  refreshVacancyResponsesFunction,
  syncArchivedVacancyResponsesFunction,
  updateVacanciesFunction,
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
  generateVacancyRecommendationFunction,
  generateGigRecommendationFunction,
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
