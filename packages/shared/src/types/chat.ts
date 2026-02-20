/**
 * Типы для чата и сообщений
 */

/**
 * Роль отправителя сообщения
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * Роль отправителя в контексте интервью
 */
export type InterviewMessageSender = "CANDIDATE" | "BOT" | "ADMIN";

/**
 * Базовое сообщение в чате
 */
export interface BaseChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

/**
 * Сообщение с ID (для UI)
 */
export interface ChatMessageWithId extends BaseChatMessage {
  id: string;
}

/**
 * Сообщение в истории диалога
 */
export interface ChatHistoryMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

/**
 * Сообщение для conversation
 */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    [key: string]: unknown;
  };
}

/**
 * Метаданные сообщения в БД
 */
export interface ChatMessageMetadata {
  isRead?: boolean;
  editedAt?: string;
  intent?: string;
  confidence?: number;
  [key: string]: unknown;
}

/**
 * Настройки бота
 */
export interface BotSettings {
  botName?: string;
  botRole?: string;
  companyName?: string;
}

/**
 * Контекст чата
 */
export interface ChatContext {
  entityType: "vacancy" | "gig" | "general";
  entityId: string;
  workspaceId: string;
  userId?: string;
}
