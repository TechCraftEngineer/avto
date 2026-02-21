/**
 * In-memory rate limiter for gig AI chat
 * Tracks message counts per user with 1-minute sliding window
 */

import type { RateLimitEntry } from "../../utils/rate-limiter-types";

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 20, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), windowMs);
  }

  /**
   * Check if user has exceeded rate limit
   * @param userId - User ID to check
   * @returns Object with allowed status and retry-after seconds if limited
   */
  check(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry) {
      // First request from this user
      this.limits.set(userId, {
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    const windowAge = now - entry.windowStart;

    if (windowAge >= this.windowMs) {
      // Window expired, reset
      this.limits.set(userId, {
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((this.windowMs - windowAge) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.limits.entries()) {
      if (now - entry.windowStart >= this.windowMs) {
        this.limits.delete(userId);
      }
    }
  }

  /**
   * Reset rate limit for a user (useful for testing)
   */
  reset(userId: string): void {
    this.limits.delete(userId);
  }

  /**
   * Get current count for a user
   */
  getCount(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry) return 0;

    const now = Date.now();
    const windowAge = now - entry.windowStart;

    if (windowAge >= this.windowMs) {
      return 0;
    }

    return entry.count;
  }
}

// Singleton instance
export const gigChatRateLimiter = new RateLimiter(20, 60000);
