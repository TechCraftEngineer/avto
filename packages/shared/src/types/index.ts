/**
 * Экспорты типов из @qbs-autonaim/shared
 * Domain-типы реэкспортируются из @qbs-autonaim/types
 */

// Domain-типы из @qbs-autonaim/types
export type {
  // Profile
  ExperienceItem,
  EducationItem,
  LanguageItem,
  PersonalInfo,
  StoredProfileData,
  ProfilePlatform,
  ProfileStatistics,
  BaseProfileData,
  ExtendedProfileData,
  ParsedProfileData,
  // Vacancy
  VacancyRequirements,
  VacancyRequirementsStrict,
  BaseVacancyData,
  ExtendedVacancyData,
  VacancyEvaluationData,
  ParsedVacancyData,
  // Response
  BaseResponseData,
  ParsedResponseData,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
  // Evaluation
  FitDecision,
  HonestyLevel,
  DimensionScore,
  EvaluationResult,
  ScreeningRecommendation,
  ScreeningResult,
  ScreeningDataForRecommendation,
  PrequalificationResult,
  // Workspace
  BaseWorkspaceData,
  ExtendedWorkspaceData,
  CompanySettings,
  OrganizationData,
  // Candidate
  BasicCandidateInfo,
  WorkExperienceEntry,
  EducationEntry,
  CandidateContactInfo,
  FreelancerProfileData,
  BaseCandidateData,
  ExtendedCandidateData,
  CandidateDataFromResponse,
  CandidateContextData,
  FullCandidateData,
  // Gig
  ContactInfo,
  BaseGigData,
  ExtendedGigData,
  GigContextData,
} from "@qbs-autonaim/types";

// Типы буферизации (остаются в shared)
export type {
  BufferedMessage,
  BufferValue,
  MessageBufferService,
} from "./buffer";

// Типы conversation
export type {
  ConversationMetadata,
  QuestionAnswer,
} from "./conversation";

// Типы gig заданий и контактов — реэкспорт ContactInfo из types, GigContextData и др. уже выше
// Типы чата и сообщений
export type {
  MessageRole,
  InterviewMessageSender,
  BaseChatMessage,
  ChatMessageWithId,
  ChatHistoryMessage,
  ConversationMessage,
  ChatMessageMetadata,
  BotSettings,
  ChatContext,
} from "./chat";

// Типы AI чата
export type {
  MessagePartType,
  TextPart,
  ReasoningPart,
  FilePart,
  ToolCallPart,
  ToolResultPart,
  MessagePart,
  AIChatMessage,
  Attachment,
  ChatStatus,
} from "./ai-chat";

export {
  getPartKey,
  convertLegacyMessage,
  getMessageText,
  hasReasoning,
  getReasoningText,
} from "./ai-chat";
