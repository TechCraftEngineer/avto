/**
 * Services module - unified exports for all service functions
 *
 * Structure:
 * - base/       - Shared utilities (Result, Logger, Constants)
 * - types/      - Service-specific type definitions
 * - vacancy/    - Vacancy CRUD and requirements extraction
 * - response/   - Response CRUD, screening, contacts extraction
 * - interview/  - AI-powered interview management
 * - messaging/  - Telegram, HH chat, welcome messages
 * - media/      - Audio transcription
 * - screening/  - Resume screening utilities
 * - triggers/   - Inngest event triggers
 * - auth/       - Authentication services
 */

// Re-export from jobs-shared
export {
  hasDetailedInfo,
  updateResponseDetails,
} from "@qbs-autonaim/jobs-shared";
// ==================== Auth ====================
export { checkHHCredentials } from "./auth";
// ==================== Collect Chat IDs ====================
export {
  collectChatIdsForVacancy,
  type CollectChatIdsOptions,
  type CollectChatIdsResult,
} from "./collect-chat-ids";
// ==================== Base Utilities ====================
export {
  // Logger
  createLogger,
  err,
  flatMap,
  INTERVIEW,
  logger,
  map,
  ok,
  type ResponseStatus,
  // Result type
  type Result,
  SCREENING,
  TELEGRAM,
  tryCatch,
  unwrap,
  unwrapOr,
} from "./base";
// ==================== Freelance ====================
export { generateFreelanceInvitation } from "./freelance";
// ==================== Kwork ====================
export { executeWithKworkTokenRefresh } from "./kwork";
// ==================== Interview ====================
export {
  addQuestionAnswer,
  analyzeAndGenerateNextQuestion,
  createInterviewScoring,
  getConversationMetadata,
  getInterviewContext,
  getInterviewStartData,
  getQuestionCount,
  identifyByPinCode,
  identifyByVacancy,
  isInterviewCompleted,
  isInterviewStarted,
  markInterviewCompleted,
  saveMessage,
  saveQuestionAnswer,
  updateConversationMetadata,
} from "./interview";

// ==================== Media ====================
export { transcribeAudio } from "./media";
// ==================== Messaging ====================
export {
  findResponseByPinCode,
  generateTelegramInvite,
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "./messaging";
export type {
  RecommendationEntityType,
  RecommendationGenerationResult,
  RecommendationInput,
  RecommendationSaveData,
} from "./recommendation";
// ==================== Recommendation ====================
export {
  getResponseDataForRecommendation,
  parseRecommendationResult,
  prepareRecommendationPrompt,
  saveRecommendation,
  toSaveData,
} from "./recommendation";
// ==================== Screen New Responses ====================
export {
  screenNewResponsesForVacancy,
  type ScreenNewResponsesOptions,
  type ScreenNewResponsesProgress,
  type ScreenNewResponsesResult,
} from "./screen-new-responses";
// ==================== Response ====================
export {
  // Repository
  checkResponseExists,
  getResponseById,
  getResponseByResumeId,
  getResponsesWithoutDetails,
  saveBasicResponse,
  saveResponseToDb,
  // Screening
  screenResponse,
  updateResponseStatus,
  uploadResumePdf,
} from "./response";
// ==================== Screening ====================
export {
  formatResumeForScreening,
  parseScreeningResult,
  prepareScreeningPrompt,
  screenResume,
  validateScreeningResult,
} from "./screening";
// ==================== Triggers ====================
export {
  triggerCandidateWelcome,
  triggerResponseScreening,
  triggerTelegramMessageSend,
  triggerVacanciesUpdate,
  triggerVacancyRequirementsExtraction,
  triggerVacancyResponsesRefresh,
  triggerVoiceTranscription,
} from "./triggers";
// ==================== Types ====================
export type {
  ExtractedContacts,
  HHContactEmail,
  HHContactPhone,
  HHContacts,
  HHContactType,
  HHPreferredContact,
} from "./types";

// ==================== Vacancy ====================
export {
  // Repository
  checkVacancyExists,
  // Requirements
  extractVacancyRequirements,
  getVacanciesWithoutDescription,
  getVacancyById,
  getVacancyRequirements,
  hasVacancyDescription,
  saveBasicVacancy,
  saveVacancyToDb,
  updateVacancyDescription,
} from "./vacancy";
