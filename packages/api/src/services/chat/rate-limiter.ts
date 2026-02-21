/**
 * Универсальный rate limiter для AI чата
 * Поддерживает разные лимиты для разных типов сущностей
 */

import type { ChatEntityType } from "@qbs-autonaim/db/schema";
import type { RateLimitEntry } from "../../utils/rate-limiter-types";

class UniversalRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<
    ChatEntityType,
    { maxRequests: number; windowMs: number }
  > = new Map();

  constructor() {
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Регистрация конфигурации для типа сущности
   */
  registerConfig(
    entityType: ChatEntityType,
    maxRequests: number,
    windowMs: number,
  ): void {
    this.configs.set(entityType, { maxRequests, windowMs });
  }

  /**
   * Проверка rate limit для пользователя и типа сущности
   */
  check(
    userId: string,
    entityType: ChatEntityType,
  ): { allowed: boolean; retryAfter?: number } {
    const config = this.configs.get(entityType) ?? {
      maxRequests: 20,
      windowMs: 60000,
    };

    const key = `${userId}:${entityType}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      this.limits.set(key, {
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    const windowAge = now - entry.windowStart;

    if (windowAge >= config.windowMs) {
      this.limits.set(key, {
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((config.windowMs - windowAge) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  /**
   * Очистка устаревших записей
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      const entityType = key.split(":")[1] as ChatEntityType;
      const config = this.configs.get(entityType) ?? { windowMs: 60000 };

      if (now - entry.windowStart >= config.windowMs) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Сброс лимита для пользователя (для тестирования)
   */
  reset(userId: string, entityType: ChatEntityType): void {
    const key = `${userId}:${entityType}`;
    this.limits.delete(key);
  }

  /**
   * Получить текущий счетчик для пользователя
   */
  getCount(userId: string, entityType: ChatEntityType): number {
    const key = `${userId}:${entityType}`;
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const config = this.configs.get(entityType) ?? { windowMs: 60000 };
    const now = Date.now();
    const windowAge = now - entry.windowStart;

    if (windowAge >= config.windowMs) {
      return 0;
    }

    return entry.count;
  }
}

export const chatRateLimiter = new UniversalRateLimiter();
