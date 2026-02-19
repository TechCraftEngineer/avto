// AI Text Sanitizer utilities
export { sanitizeAiText, sanitizeAiTextArray } from "./ai-text-sanitizer";

// Error utilities
export { InterviewSDKError } from "./errors";

// Logger utilities
export { createLogger, logger } from "./logger";
// Pluralization utilities
export { getPluralForm } from "./pluralization";
// Prompt sanitization utilities
export {
  sanitizeConversationMessage,
  sanitizePromptText,
  truncateText,
} from "./prompt-sanitizer";
// Rate limiting utilities
export { checkRateLimit, getRateLimiter } from "./rate-limiter";
// Result utilities
export type { Result } from "./result";
export {
  err,
  flatMap,
  map,
  ok,
  tryCatch,
  unwrap,
  unwrapOr,
} from "./result";
// Date utilities
export {
  calculateAge,
  createUTCDate,
  formatBirthDate,
  formatBirthDateWithAge,
  formatDateForInput,
  parseBirthDate,
  parseDateFromInput,
} from "./utils/date-utils";
// Name parsing utilities
export { parseFullName } from "./utils/name-utils";

// Sanitization utilities
export { removeNullBytes, sanitizeObject } from "./utils/sanitize";
