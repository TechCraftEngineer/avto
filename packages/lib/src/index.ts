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
  sanitizePromptText,
  truncateText,
  sanitizeConversationMessage
} from "./prompt-sanitizer";

// Rate limiting utilities
export { getRateLimiter, checkRateLimit } from "./rate-limiter";

// Result utilities
export type { Result } from "./result";
export {
  ok,
  err,
  tryCatch,
  unwrap,
  unwrapOr,
  map,
  flatMap
} from "./result";

// Date utilities
export {
  parseBirthDate,
  createUTCDate,
  calculateAge,
  formatBirthDate,
  formatDateForInput,
  parseDateFromInput
} from "./utils/date-utils";

// Sanitization utilities
export { removeNullBytes, sanitizeObject } from "./utils/sanitize";
