/**
 * Главный экспорт пакета @qbs-autonaim/shared
 *
 * ⚠️ ВНИМАНИЕ: Этот модуль безопасен для использования на клиенте
 * Серверные сервисы с БД импортируйте из @qbs-autonaim/shared/server
 */

// Константы для психометрического анализа
export {
  formatPsychotype,
  getCompatibilityLevel,
  PSYCHOMETRIC_LABELS,
} from "./constants/psychometric-labels";
// Схемы (безопасно для клиента)
export {
  type CreateDraftInput,
  CreateDraftInputSchema,
  type Draft,
  DraftSchema,
  type Message,
  MessageSchema,
  type UpdateDraftInput,
  UpdateDraftInputSchema,
  type VacancyData,
  VacancyDataSchema,
} from "./schemas";
// Типы
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
  // Типы профилей
  ProfilePlatform,
  ProfileStatistics,
  BaseProfileData,
  ExtendedProfileData,
  ParsedProfileData,
  // Типы gig и контактов
  ContactInfo,
  BaseGigData,
  ExtendedGigData,
  GigContextData,
  // Типы вакансий
  VacancyRequirements,
  VacancyRequirementsStrict,
  BaseVacancyData,
  ExtendedVacancyData,
  VacancyEvaluationData,
  ParsedVacancyData,
  // Типы откликов
  BaseResponseData,
  ParsedResponseData,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
  // Типы чата и сообщений
  MessageRole,
  InterviewMessageSender,
  BaseChatMessage,
  ChatMessageWithId,
  ChatHistoryMessage,
  ConversationMessage,
  ChatMessageMetadata,
  BotSettings,
  ChatContext,
  // Типы оценки и скрининга
  FitDecision,
  HonestyLevel,
  EvaluationResult,
  DimensionScore,
  ScreeningRecommendation,
  ScreeningResult,
  ScreeningDataForRecommendation,
  PrequalificationResult,
  // Типы workspace и организаций
  BaseWorkspaceData,
  ExtendedWorkspaceData,
  CompanySettings,
  OrganizationData,
  // Типы кандидатов
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
  // Типы AI чата
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
} from "./types";
// AI чат — типы и утилиты
export {
  getPartKey,
  convertLegacyMessage,
  getMessageText,
  hasReasoning,
  getReasoningText,
} from "./types";
// Утилиты
export {
  getInitials,
  getPlatformTaskUrl,
  getResponseEventTitle,
  type ParsedPlatformLink,
  parsePlatformLink,
  pluralize,
} from "./utils";
// Утилиты для работы с опытом
export {
  formatExperienceText,
  getExperienceFromProfile,
  getExperienceSummary,
  hasExperience,
} from "./utils/experience-helpers";
