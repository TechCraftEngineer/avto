/**
 * Серверные утилиты @qbs-autonaim/server-utils
 * Этот пакет содержит функции, которые работают только на сервере и используют БД
 */

// Экспорты conversation утилит
export {
  ConversationMetadataSchema,
  getChatSessionMetadata,
  getConversationMetadata,
  getInterviewQuestionCount,
  getInterviewSessionMetadata,
  getQuestionCount,
  updateChatSessionMetadata,
  updateConversationMetadata,
  updateInterviewSessionMetadata,
} from "./conversation";

// Экспорты interview URL утилит
export {
  getInterviewBaseUrl,
  getInterviewUrl,
  getInterviewUrlFromDb,
  getInterviewUrlFromEntity,
} from "./get-interview-url";

// Экспорты security утилит
export {
  securityMiddleware,
  addSecurityHeaders,
  addAPISecurityHeaders,
} from "./security-headers";

// Экспорты rate limiting утилит
export {
  rateLimit,
  RATE_LIMITS,
  getClientIP,
  cleanupExpiredRecords,
} from "./rate-limiter";

// Экспорты security audit утилит
export {
  SecurityEventType,
  SecurityAuditLogger,
  securityAuditLogger,
  logSecurityEvent,
} from "./security-audit";

export type { SecurityEvent } from "./security-audit";
