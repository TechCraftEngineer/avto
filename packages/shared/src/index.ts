/**
 * Главный экспорт пакета @qbs-autonaim/shared
 *
 * ⚠️ ВНИМАНИЕ: Этот модуль безопасен для использования на клиенте
 * Серверные сервисы с БД импортируйте из @qbs-autonaim/shared/server
 */

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
} from "./types";

// Утилиты
export {
  getInitials,
  getPlatformTaskUrl,
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
