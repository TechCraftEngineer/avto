/**
 * Client-safe utilities (date, sanitize).
 * Использовать для клиентских компонентов вместо @qbs-autonaim/lib
 */
// Date utilities
export {
  calculateAge,
  createUTCDate,
  formatBirthDate,
  formatBirthDateWithAge,
  formatDateForInput,
  parseBirthDate,
  parseDateFromInput,
} from "./date-utils";

// Platform profile URL normalization (HH subdomains → hh.ru)
export { normalizePlatformProfileUrl } from "./normalize-profile-url";
// Sanitization utilities
export { removeNullBytes, sanitizeObject } from "./sanitize";
