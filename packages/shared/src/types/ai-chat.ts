/**
 * Типы для AI чата
 * Адаптированы из ai-chatbot
 */

import type { MessageRole } from "./chat";

export type MessagePartType =
  | "text"
  | "reasoning"
  | "file"
  | "tool-call"
  | "tool-result";

export interface TextPart {
  type: "text";
  text: string;
  /** Уникальный идентификатор для стабильных React ключей */
  id?: string;
}

export interface ReasoningPart {
  type: "reasoning";
  text: string;
  /** Уникальный идентификатор для стабильных React ключей */
  id?: string;
}

export interface FilePart {
  type: "file";
  url: string;
  filename?: string;
  mediaType: string;
  /** Уникальный идентификатор для стабильных React ключей */
  id?: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  result: unknown;
}

/**
 * Генерирует стабильный ключ для MessagePart
 * Использует id если есть, иначе создаёт хеш из контента
 */
export function getPartKey(part: MessagePart, messageId: string): string {
  // Если есть id — используем его
  if ("id" in part && part.id) {
    return part.id;
  }

  // Для tool-call/tool-result используем toolCallId
  if (part.type === "tool-call" || part.type === "tool-result") {
    return `${messageId}-${part.type}-${part.toolCallId}`;
  }

  // Для file используем url
  if (part.type === "file") {
    return `${messageId}-file-${part.url}`;
  }

  // Для text/reasoning создаём хеш из контента
  if (part.type === "text" || part.type === "reasoning") {
    const content = part.text || "";
    // Простой хеш: первые 20 символов + длина
    const hash = `${content.slice(0, 20).replace(/\s/g, "_")}-${content.length}`;
    return `${messageId}-${part.type}-${hash}`;
  }

  return `${messageId}-unknown`;
}

export type MessagePart =
  | TextPart
  | ReasoningPart
  | FilePart
  | ToolCallPart
  | ToolResultPart;

export interface AIChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

/**
 * Конвертация legacy сообщений в новый формат
 */
export function convertLegacyMessage(message: {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
  voiceTranscription?: string | null;
  fileUrl?: string | null;
}): AIChatMessage {
  const role: MessageRole =
    message.sender === "CANDIDATE" ? "user" : "assistant";

  const parts: MessagePart[] = [];

  if (message.contentType === "VOICE" && message.fileUrl) {
    parts.push({
      type: "file",
      url: message.fileUrl,
      mediaType: "audio/ogg",
    });
    if (message.voiceTranscription) {
      parts.push({
        type: "text",
        text: message.voiceTranscription,
      });
    }
  } else {
    parts.push({
      type: "text",
      text: message.content,
    });
  }

  return {
    id: message.id,
    role,
    parts,
    createdAt: message.createdAt,
  };
}

/**
 * Извлечение текста из сообщения
 */
export function getMessageText(message: AIChatMessage): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

/**
 * Проверка наличия reasoning в сообщении
 */
export function hasReasoning(message: AIChatMessage): boolean {
  return message.parts.some((part) => part.type === "reasoning");
}

/**
 * Получение reasoning из сообщения
 */
export function getReasoningText(message: AIChatMessage): string | null {
  const reasoningPart = message.parts.find(
    (part): part is ReasoningPart => part.type === "reasoning",
  );
  return reasoningPart?.text ?? null;
}
