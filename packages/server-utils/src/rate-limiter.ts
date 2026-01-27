/**
 * Rate limiting utility for API endpoints
 * Prevents brute force attacks and abuse
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
  timestamps: number[]; // История запросов для анализа паттернов
  burstCount: number; // Счетчик для burst detection
  lastBurstReset: number;
}

interface RateLimitStore {
  [key: string]: RateLimitRecord;
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

/**
 * Умная система rate limiting с учетом паттернов использования
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @param options - Дополнительные опции
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  options?: {
    weight?: number; // Вес запроса (mutation = 2, query = 1)
    burstLimit?: number; // Лимит для burst detection
    burstWindowMs?: number; // Окно для burst detection (по умолчанию 10 секунд)
  },
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const weight = options?.weight ?? 1;
  const burstLimit = options?.burstLimit ?? Math.ceil(limit / 10); // 10% от основного лимита
  const burstWindowMs = options?.burstWindowMs ?? 10000; // 10 секунд

  // Clean up expired records
  const record = rateLimitStore[key];
  if (record && now > record.resetTime) {
    delete rateLimitStore[key];
  }

  // Получаем или создаем запись
  const currentRecord = rateLimitStore[key] ?? {
    count: 0,
    resetTime: now + windowMs,
    timestamps: [],
    burstCount: 0,
    lastBurstReset: now,
  };

  // Сбрасываем burst счетчик если прошло окно
  if (now - currentRecord.lastBurstReset > burstWindowMs) {
    currentRecord.burstCount = 0;
    currentRecord.lastBurstReset = now;
  }

  // Очищаем старые timestamps (старше окна)
  currentRecord.timestamps = currentRecord.timestamps.filter(
    (ts) => now - ts < windowMs,
  );

  // Проверяем burst - слишком много запросов за короткое время
  const recentRequests = currentRecord.timestamps.filter(
    (ts) => now - ts < burstWindowMs,
  ).length;

  if (recentRequests >= burstLimit) {
    // Burst detected - блокируем
    rateLimitStore[key] = currentRecord;
    return {
      success: false,
      remaining: 0,
      resetTime: currentRecord.lastBurstReset + burstWindowMs,
    };
  }

  // Проверяем основной лимит с учетом веса
  const weightedCount = currentRecord.count + weight;
  if (weightedCount > limit) {
    rateLimitStore[key] = currentRecord;
    return {
      success: false,
      remaining: 0,
      resetTime: currentRecord.resetTime,
    };
  }

  // Обновляем запись
  currentRecord.count = weightedCount;
  currentRecord.burstCount++;
  currentRecord.timestamps.push(now);
  rateLimitStore[key] = currentRecord;

  return {
    success: true,
    remaining: Math.max(0, limit - weightedCount),
    resetTime: currentRecord.resetTime,
  };
}

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    signIn: {
      limit: 5,
      windowMs: 15 * 60 * 1000,
      burstLimit: 3,
      burstWindowMs: 30000,
    }, // 5 attempts per 15 min, max 3 за 30 сек
    signUp: {
      limit: 3,
      windowMs: 60 * 60 * 1000,
      burstLimit: 2,
      burstWindowMs: 60000,
    }, // 3 attempts per hour, max 2 за минуту
    resetPassword: {
      limit: 3,
      windowMs: 60 * 60 * 1000,
      burstLimit: 2,
      burstWindowMs: 60000,
    },
    emailVerification: {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      burstLimit: 3,
      burstWindowMs: 60000,
    },
  },
  // General API endpoints
  api: {
    // Query endpoints - более мягкие лимиты
    query: {
      limit: 300,
      windowMs: 15 * 60 * 1000,
      burstLimit: 30,
      burstWindowMs: 10000,
      weight: 1,
    }, // 300 запросов за 15 мин, max 30 за 10 сек
    // Mutation endpoints - строже
    mutation: {
      limit: 100,
      windowMs: 15 * 60 * 1000,
      burstLimit: 10,
      burstWindowMs: 10000,
      weight: 2,
    }, // 100 запросов за 15 мин (вес 2), max 10 за 10 сек
    // Default - средние значения
    default: {
      limit: 200,
      windowMs: 15 * 60 * 1000,
      burstLimit: 20,
      burstWindowMs: 10000,
      weight: 1,
    },
    upload: {
      limit: 10,
      windowMs: 60 * 60 * 1000,
      burstLimit: 3,
      burstWindowMs: 60000,
      weight: 5,
    }, // 10 uploads per hour, вес 5
  },
  // Sensitive operations
  sensitive: {
    profileUpdate: {
      limit: 10,
      windowMs: 60 * 60 * 1000,
      burstLimit: 3,
      burstWindowMs: 60000,
      weight: 2,
    },
    passwordChange: {
      limit: 3,
      windowMs: 60 * 60 * 1000,
      burstLimit: 2,
      burstWindowMs: 120000,
      weight: 3,
    },
  },
} as const;

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip"); // Cloudflare
  const trueClientIP = request.headers.get("true-client-ip"); // Cloudflare Enterprise
  const xClientIP = request.headers.get("x-client-ip");

  // В dev режиме логируем все заголовки для отладки
  if (process.env.NODE_ENV === "development") {
    const ipHeaders = {
      "x-forwarded-for": forwarded,
      "x-real-ip": realIP,
      "cf-connecting-ip": cfConnectingIP,
      "true-client-ip": trueClientIP,
      "x-client-ip": xClientIP,
    };
    const hasAnyIP = Object.values(ipHeaders).some((v) => v);
    if (hasAnyIP) {
      console.log("[IP Detection] Headers:", ipHeaders);
    }
  }

  // Приоритет: Cloudflare > x-forwarded-for > x-real-ip > x-client-ip
  if (cfConnectingIP?.trim()) {
    return cfConnectingIP.trim();
  }

  if (trueClientIP?.trim()) {
    return trueClientIP.trim();
  }

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

  if (xClientIP?.trim()) {
    return xClientIP.trim();
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

/**
 * Получить статистику rate limiting для мониторинга
 */
export function getRateLimitStats(): {
  totalRecords: number;
  activeRecords: number;
  expiredRecords: number;
} {
  const now = Date.now();
  let activeRecords = 0;
  let expiredRecords = 0;

  for (const record of Object.values(rateLimitStore)) {
    if (now > record.resetTime) {
      expiredRecords++;
    } else {
      activeRecords++;
    }
  }

  return {
    totalRecords: Object.keys(rateLimitStore).length,
    activeRecords,
    expiredRecords,
  };
}
