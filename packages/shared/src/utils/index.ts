/**
 * Экспорты утилит из пакета @qbs-autonaim/shared
 * Этот пакет содержит только чистые утилиты, которые могут работать в браузере
 */

// Утилиты для работы с фриланс-платформами
export {
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "./freelance-platform-parser";
// URL для интервью
export { getInterviewBaseUrl } from "./get-interview-url";
// Генерация slug
export { generateSlug } from "./slug-generator";
