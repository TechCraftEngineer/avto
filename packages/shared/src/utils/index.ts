/**
 * Экспорты утилит из пакета @qbs-autonaim/shared
 * Этот пакет содержит только чистые утилиты, которые могут работать в браузере
 */

// Утилиты для работы с опытом работы
export {
  formatExperienceText,
  getExperienceFromProfile,
  getExperienceSummary,
  hasExperience,
} from "./experience-helpers";
// Утилиты для работы с фриланс-платформами
export {
  getPlatformTaskUrl,
  type ParsedPlatformLink,
  parsePlatformLink,
} from "./freelance-platform-parser";
// Получение инициалов из имени
export { getInitials } from "./get-initials";
// URL для интервью
export { getInterviewBaseUrl } from "./get-interview-url";
// Русская плюрализация
export { pluralize } from "./pluralize";
// Форматирование событий откликов
export { getResponseEventTitle } from "./response-event-formatter";
// Генерация slug
export { generateSlug } from "./slug-generator";
