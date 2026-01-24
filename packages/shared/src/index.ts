/**
 * Главный экспорт пакета @qbs-autonaim/shared
 *
 * Предоставляет общие типы и утилиты для использования
 * в пакетах @qbs-autonaim/jobs и @qbs-autonaim/tg-client
 */

// Экспорт gig shortlist generator
export type {
  GigContactInfo,
  GigShortlist,
  GigShortlistCandidate,
  GigShortlistOptions,
} from "./gig-shortlist-generator";
export { GigShortlistGenerator } from "./gig-shortlist-generator";
// Экспорт ranking service
export * from "./ranking-service";
// Экспорт всех типов
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
} from "./types";

// Серверные утилиты теперь экспортируются из @qbs-autonaim/server-utils
// Экспорт клиентских утилит
export {
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "./utils";
