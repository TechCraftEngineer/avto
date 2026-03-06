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
  type QuickReply,
  QuickReplySchema,
  type UpdateDraftInput,
  UpdateDraftInputSchema,
  type VacancyData,
  VacancyDataSchema,
} from "./schemas";
// Типы
export type {
  AIChatMessage,
  Attachment,
  BaseCandidateData,
  BaseChatMessage,
  BaseGigData,
  BaseProfileData,
  // Типы откликов
  BaseResponseData,
  BaseVacancyData,
  // Типы workspace и организаций
  BaseWorkspaceData,
  // Типы кандидатов
  BasicCandidateInfo,
  BotSettings,
  BufferedMessage,
  BufferValue,
  CandidateContactInfo,
  CandidateContextData,
  CandidateDataFromResponse,
  ChatContext,
  ChatHistoryMessage,
  ChatMessageMetadata,
  ChatMessageWithId,
  ChatStatus,
  CompanySettings,
  // Типы gig и контактов
  ContactInfo,
  ConversationMessage,
  ConversationMetadata,
  DimensionScore,
  EducationEntry,
  EvaluationResult,
  ExtendedCandidateData,
  ExtendedGigData,
  ExtendedProfileData,
  ExtendedVacancyData,
  ExtendedWorkspaceData,
  FilePart,
  // Типы оценки и скрининга
  FitDecision,
  FreelancerProfileData,
  FullCandidateData,
  GigContextData,
  HonestyLevel,
  InterviewMessageSender,
  MessageBufferService,
  MessagePart,
  // Типы AI чата
  MessagePartType,
  // Типы чата и сообщений
  MessageRole,
  OrganizationData,
  ParsedProfileData,
  ParsedResponseData,
  ParsedVacancyData,
  PrequalificationResult,
  // Типы профилей
  ProfilePlatform,
  ProfileStatistics,
  QuestionAnswer,
  ReasoningPart,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
  ScreeningDataForRecommendation,
  ScreeningRecommendation,
  ScreeningResult,
  SortDirection,
  TextPart,
  ToolCallPart,
  ToolResultPart,
  VacancyEvaluationData,
  // Типы вакансий
  VacancyRequirements,
  VacancyRequirementsStrict,
  WorkExperienceEntry,
} from "./types";
// AI чат — типы и утилиты
export {
  convertLegacyMessage,
  getMessageText,
  getPartKey,
  getReasoningText,
  hasReasoning,
} from "./types";
// Утилиты
export {
  type Contact,
  type ContactsData,
  formatContacts,
  getInitials,
  getPlatformTaskUrl,
  getPrimaryContacts,
  getResponseEventTitle,
  mergeContacts,
  normalizeToContactsData,
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
