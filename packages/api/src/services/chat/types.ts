/**
 * Универсальные типы для системы AI чата
 */

import type { db } from "@qbs-autonaim/db/client";
import type { ChatEntityType } from "@qbs-autonaim/db/schema";
import type { ChatHistoryMessage } from "@qbs-autonaim/shared";

/**
 * Контекст сущности для AI чата
 */
export interface ChatContext {
  entityType: ChatEntityType;
  entityId: string;
  mainContext: Record<string, unknown>;
  relatedContext: Record<string, unknown>;
  statistics: Record<string, unknown>;
}

/** Реэкспорт из @qbs-autonaim/shared для обратной совместимости */
export type { ChatHistoryMessage };

/**
 * Конфигурация промпта для конкретного типа сущности
 */
export interface PromptConfig {
  systemRole: string;
  contextFormatters: {
    main: (ctx: Record<string, unknown>) => string;
    related: (ctx: Record<string, unknown>) => string;
    statistics: (ctx: Record<string, unknown>) => string;
  };
  quickRepliesGenerator?: (ctx: ChatContext) => string[];
  welcomeMessage?: string;
  emptyStateMessage?: string;
}

/**
 * Конфигурация rate limiting для типа сущности
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Интерфейс загрузчика контекста
 */
export interface ContextLoader {
  loadContext(
    database: typeof db,
    entityId: string,
  ): Promise<ChatContext | null>;
}

/**
 * Регистрация типа сущности в системе чата
 */
export interface ChatEntityRegistration {
  entityType: ChatEntityType;
  loader: ContextLoader;
  promptConfig: PromptConfig;
  rateLimitConfig?: RateLimitConfig;
}

/**
 * Ответ от AI
 */
export interface AIChatResponse {
  message: string;
  quickReplies?: string[];
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    entitiesMentioned?: string[];
    analysisType?: string;
    [key: string]: unknown;
  };
}
