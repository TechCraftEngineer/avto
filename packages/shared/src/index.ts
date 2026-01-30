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
// Экспорт interview link generator
export type { InterviewLink } from "./interview-link-generator";
export { InterviewLinkGenerator } from "./interview-link-generator";
// Экспорт ranking service
export * from "./ranking-service";
// Экспорт схем
export * from "./schemas";
// Экспорт всех типов
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
} from "./types";

// Серверные утилиты теперь экспортируются из @qbs-autonaim/server-utils
// Экспорт клиентских утилит (для обратной совместимости - используйте @qbs-autonaim/shared/client)
export {
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "./utils";

// Примечание: sanitizeHtmlFunction теперь доступен через @qbs-autonaim/shared/client
// для использования в браузере без Node.js зависимостей
