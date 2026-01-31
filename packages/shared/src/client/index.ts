/**
 * Client-safe exports from @qbs-autonaim/shared
 * These utilities can be used in browser environments without Node.js dependencies
 */

export type {
  GigContactInfo,
  GigShortlist,
  GigShortlistCandidate,
  GigShortlistOptions,
} from "../gig-shortlist-generator";
export type { InterviewLink } from "../interview-link-generator";
// Типы - безопасны для клиента
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
} from "../types";
// Утилиты для работы с фриланс-платформами - безопасны для клиента
export {
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "../utils/freelance-platform-parser";
// URL для интервью - безопасен для клиента (только базовый URL)
export { getInterviewBaseUrl } from "../utils/get-interview-url";
// Санитизация HTML - безопасна для клиента
export { sanitizeHtmlFunction } from "../utils/sanitize-html";
// Генерация slug - безопасна для клиента
export { generateSlug } from "../utils/slug-generator";
