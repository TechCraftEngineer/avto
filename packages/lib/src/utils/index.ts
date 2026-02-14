/**
 * Client-safe utilities (date, sanitize).
 * Использовать для клиентских компонентов вместо @qbs-autonaim/lib
 */
// Date utilities
export {
  calculateAge,
  createUTCDate,
  formatBirthDate,
  formatDateForInput,
  parseBirthDate,
  parseDateFromInput,
} from "./date-utils";

// Sanitization utilities
export { removeNullBytes, sanitizeObject } from "./sanitize";
