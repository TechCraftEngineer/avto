/**
 * Экспорты типов из пакета @qbs-autonaim/shared
 */

// Типы буферизации
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

// Типы профилей
export type {
  ProfilePlatform,
  ProfileStatistics,
  BaseProfileData,
  ExtendedProfileData,
  ParsedProfileData,
} from "./profile";

// Типы gig заданий и контактов
export type {
  ContactInfo,
  BaseGigData,
  ExtendedGigData,
  GigContextData,
} from "./gig";

// Типы вакансий
export type {
  VacancyRequirements,
  BaseVacancyData,
  ExtendedVacancyData,
  VacancyEvaluationData,
  ParsedVacancyData,
} from "./vacancy";

// Типы откликов
export type {
  BaseResponseData,
  ParsedResponseData,
  ResumeContactInfo,
  ResumeExperience,
} from "./response";

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

// Типы оценки и скрининга
export type {
  FitDecision,
  HonestyLevel,
  EvaluationResult,
  DimensionScore,
  ScreeningResult,
  ScreeningRecommendation,
  ScreeningDataForRecommendation,
  PrequalificationResult,
} from "./evaluation";

// Типы workspace и организаций
export type {
  BaseWorkspaceData,
  ExtendedWorkspaceData,
  CompanySettings,
  OrganizationData,
} from "./workspace";

// Типы кандидатов
export type {
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
} from "./candidate";
