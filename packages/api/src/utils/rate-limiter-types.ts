/**
 * Типы для rate limiter
 * Централизованный источник для chat и gig-chat rate limiters
 */

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}
