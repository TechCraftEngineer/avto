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
} from "./schemas/draft";
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
  BaseVacancyData,
  ExtendedVacancyData,
  VacancyEvaluationData,
  ParsedVacancyData,
  // Типы откликов
  BaseResponseData,
  ParsedResponseData,
  ResumeContactInfo,
  ResumeExperience,
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
