/**
 * Rate limiting utility for API endpoints
 * Prevents brute force attacks and abuse
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore[key];

  // Clean up expired records
  if (record && now > record.resetTime) {
    delete rateLimitStore[key];
  }

  // Check if user has exceeded limit
  const currentRecord = rateLimitStore[key];
  if (currentRecord) {
    if (currentRecord.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: currentRecord.resetTime,
      };
    }
    currentRecord.count++;
    return {
      success: true,
      remaining: limit - currentRecord.count,
      resetTime: currentRecord.resetTime,
    };
  }

  // Create new record
  rateLimitStore[key] = {
    count: 1,
    resetTime: now + windowMs,
  };

  return {
    success: true,
    remaining: limit - 1,
    resetTime: now + windowMs,
  };
}

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    signIn: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    signUp: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    resetPassword: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    emailVerification: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 attempts per hour
  },
  // General API endpoints
  api: {
    default: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    upload: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 uploads per hour
  },
  // Sensitive operations
  sensitive: {
    profileUpdate: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 updates per hour
    passwordChange: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 changes per hour
  },
} as const;

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    const trimmedForwarded = forwarded.trim();
    if (trimmedForwarded) {
      const ips = trimmedForwarded.split(",");
      if (ips.length > 0 && ips[0]) {
        const firstIP = ips[0].trim();
        if (firstIP) {
          return firstIP;
        }
      }
    }
  }

  if (realIP?.trim()) {
    return realIP.trim();
  }

  return "unknown";
}

/**
 * Cleanup expired rate limit records
 * Should be called periodically (e.g., every hour)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, record] of Object.entries(rateLimitStore)) {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    delete rateLimitStore[key];
  }
}
