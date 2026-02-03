/**
 * Главный экспорт пакета @qbs-autonaim/shared
 *
 * ⚠️ ВНИМАНИЕ: Этот модуль безопасен для использования на клиенте
 * Серверные сервисы с БД импортируйте из @qbs-autonaim/shared/server
 */

// Экспорт схем (безопасно для клиента)
export * from "./schemas";
export type { InterviewLink } from "./server/interview-link-generator";
export type {
  GetRankedCandidatesFilters,
  RankingServiceError,
} from "./server/ranking-service";
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
} from "./types";
// Экспорт клиентских утилит
export {
  getInitials,
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "./utils";
export * from "./utils/experience-helpers";
