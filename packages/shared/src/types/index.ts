/**
 * Экспорты типов из @qbs-autonaim/shared
 * Domain-типы реэкспортируются из @qbs-autonaim/types
 */

// Domain-типы из @qbs-autonaim/types
export type {
  BaseCandidateData,
  BaseGigData,
  BaseProfileData,
  // Response
  BaseResponseData,
  BaseVacancyData,
  // Workspace
  BaseWorkspaceData,
  // Candidate
  BasicCandidateInfo,
  CandidateContactInfo,
  CandidateContextData,
  CandidateDataFromResponse,
  CompanySettings,
  // Gig
  ContactInfo,
  DimensionScore,
  EducationEntry,
  EducationItem,
  EvaluationResult,
  // Profile
  ExperienceItem,
  ExtendedCandidateData,
  ExtendedGigData,
  ExtendedProfileData,
  ExtendedVacancyData,
  ExtendedWorkspaceData,
  // Evaluation
  FitDecision,
  FreelancerProfileData,
  FullCandidateData,
  GigContextData,
  HonestyLevel,
  LanguageItem,
  OrganizationData,
  ParsedProfileData,
  ParsedResponseData,
  ParsedVacancyData,
  PersonalInfo,
  PrequalificationResult,
  ProfilePlatform,
  ProfileStatistics,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
  ScreeningDataForRecommendation,
  ScreeningRecommendation,
  ScreeningResult,
  // Common
  SortDirection,
  StoredProfileData,
  VacancyEvaluationData,
  // Vacancy
  VacancyRequirements,
  VacancyRequirementsStrict,
  WorkExperienceEntry,
} from "@qbs-autonaim/types";
// Типы AI чата
export type {
  AIChatMessage,
  Attachment,
  ChatStatus,
  FilePart,
  MessagePart,
  MessagePartType,
  ReasoningPart,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from "./ai-chat";
export {
  convertLegacyMessage,
  getMessageText,
  getPartKey,
  getReasoningText,
  hasReasoning,
} from "./ai-chat";
// Типы буферизации (остаются в shared)
export type {
  BufferedMessage,
  BufferValue,
  MessageBufferService,
} from "./buffer";
// Типы gig заданий и контактов — реэкспорт ContactInfo из types, GigContextData и др. уже выше
// Типы чата и сообщений
export type {
  BaseChatMessage,
  BotSettings,
  ChatContext,
  ChatHistoryMessage,
  ChatMessageMetadata,
  ChatMessageWithId,
  ConversationMessage,
  InterviewMessageSender,
  MessageRole,
} from "./chat";
// Типы conversation
export type {
  ConversationMetadata,
  QuestionAnswer,
} from "./conversation";
