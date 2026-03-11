import { cvscoreDb } from "@qbs-autonaim/db/client.cvscore";
import { cvscoreScreeningResult } from "@qbs-autonaim/db/schema";
import { generateObject } from "@qbs-autonaim/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildScreeningPrompt,
  RESUME_MAX_CHARS,
  RESUME_MIN_CHARS,
  screeningOutputSchema,
  VACANCY_MAX_CHARS,
  VACANCY_MIN_CHARS,
} from "@/lib/screening-prompt";

/** Максимальный размер JSON payload (5MB) */
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

/** Таймаут для AI запроса (60 секунд — скрининг объёмного резюме может занимать время) */
const AI_REQUEST_TIMEOUT_MS = 60_000;

/** Лимит выполнения роута для Next.js (секунды) — должен быть ≥ AI timeout */
export const maxDuration = 70;

/** Защита от prompt injection: запрещенные паттерны */
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /system\s*:\s*/i,
  /assistant\s*:\s*/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<script[\s>]/i,
  /<iframe[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc
];

function containsSuspiciousContent(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

function sanitizeText(text: string): string {
  // Удаляем потенциально опасные control characters
  // Создаем regex динамически чтобы избежать ESLint ошибок
  const controlCharsPattern = new RegExp(
    `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
    "g",
  );
  return text.replace(controlCharsPattern, "").trim();
}

const requestSchema = z.object({
  resume: z
    .string()
    .transform((s) => sanitizeText(s))
    .refine(
      (s) => s.length >= RESUME_MIN_CHARS,
      `Резюме должно содержать минимум ${RESUME_MIN_CHARS} символов`,
    )
    .refine(
      (s) => s.length <= RESUME_MAX_CHARS,
      `Резюме должно содержать не более ${RESUME_MAX_CHARS} символов`,
    )
    .refine(
      (s) => !containsSuspiciousContent(s),
      "Обнаружен подозрительный контент в резюме",
    ),
  vacancy: z
    .string()
    .transform((s) => sanitizeText(s))
    .refine(
      (s) => s.length >= VACANCY_MIN_CHARS,
      `Вакансия должна содержать минимум ${VACANCY_MIN_CHARS} символов`,
    )
    .refine(
      (s) => s.length <= VACANCY_MAX_CHARS,
      `Вакансия должна содержать не более ${VACANCY_MAX_CHARS} символов`,
    )
    .refine(
      (s) => !containsSuspiciousContent(s),
      "Обнаружен подозрительный контент в вакансии",
    ),
  consentToStore: z.boolean().optional().default(false),
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Берем первый IP из цепочки (реальный клиент)
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ?? // Cloudflare
    "unknown"
  );
}

/**
 * Rate limiting через базу данных (работает в serverless)
 * Альтернатива: использовать Redis, Upstash, или Vercel KV
 *
 * ВАЖНО: Эта функция - заглушка для будущей реализации через Redis/KV
 * Сейчас используется checkRateLimitMemory для простоты
 */
// async function checkRateLimitDb(
//   ip: string,
// ): Promise<{ allowed: boolean; retryAfter?: number }> {
//   // TODO: Реализовать через Redis/Upstash/Vercel KV для продакшена
//   return { allowed: true };
// }

/** Простой in-memory rate limit (работает только в dev, не в serverless) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimitMemory(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();

  // Очистка старых записей
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

/** Логирование подозрительной активности */
function logSuspiciousActivity(
  ip: string,
  reason: string,
  data?: unknown,
): void {
  console.warn("[SECURITY]", {
    timestamp: new Date().toISOString(),
    ip,
    reason,
    data,
  });
}

/** CORS headers для безопасности */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

/** OPTIONS для CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Проверка размера payload
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    logSuspiciousActivity(ip, "Payload too large", { size: contentLength });
    return jsonResponse({ error: "Слишком большой запрос" }, 413);
  }

  // Rate limiting
  const rateResult = checkRateLimitMemory(ip);
  if (!rateResult.allowed) {
    logSuspiciousActivity(ip, "Rate limit exceeded");
    return jsonResponse(
      {
        error: "Превышен лимит запросов",
        message: `Попробуйте снова через ${rateResult.retryAfter} секунд`,
      },
      429,
      {
        "Retry-After": String(rateResult.retryAfter ?? 60),
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        "X-RateLimit-Remaining": "0",
      },
    );
  }

  // Парсинг JSON с защитой от больших payload
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_PAYLOAD_SIZE) {
      logSuspiciousActivity(ip, "Text payload too large", {
        size: text.length,
      });
      return jsonResponse({ error: "Слишком большой запрос" }, 413);
    }
    body = JSON.parse(text);
  } catch (error) {
    logSuspiciousActivity(ip, "Invalid JSON", { error });
    return jsonResponse({ error: "Некорректный JSON" }, 400);
  }

  // Валидация входных данных
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    logSuspiciousActivity(ip, "Validation failed", {
      error: firstError?.message,
    });
    return jsonResponse(
      {
        error: "Ошибка валидации",
        message: firstError?.message ?? "Проверьте введённые данные",
      },
      400,
    );
  }

  const { resume, vacancy, consentToStore } = parsed.data;

  try {
    const prompt = buildScreeningPrompt(resume, vacancy);

    const { object } = await generateObject({
      model: undefined,
      prompt,
      schema: screeningOutputSchema,
      generationName: "cvscore-screening",
      metadata: { source: "cvscore", ip },
      abortSignal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    // Дополнительная валидация результата AI
    if (
      typeof object.score !== "number" ||
      object.score < 0 ||
      object.score > 100
    ) {
      throw new Error("Invalid AI response: score out of range");
    }

    if (!Array.isArray(object.strengths) || !Array.isArray(object.risks)) {
      throw new Error("Invalid AI response: invalid arrays");
    }

    // Санитизация данных перед сохранением
    const resumeToStore = consentToStore
      ? sanitizeText(resume.slice(0, RESUME_MAX_CHARS))
      : "[скрининг без сохранения резюме — нет согласия]";
    const vacancyToStore = consentToStore
      ? sanitizeText(vacancy.slice(0, VACANCY_MAX_CHARS))
      : "[описание вакансии не сохранено — нет согласия]";

    const strengthsToStore = consentToStore
      ? object.strengths.map((s) => sanitizeText(s))
      : [];
    const risksToStore = consentToStore
      ? object.risks.map((r) => sanitizeText(r))
      : [];
    const questionsToStore = consentToStore
      ? object.interviewQuestions.map((q) => sanitizeText(q))
      : [];

    await cvscoreDb.insert(cvscoreScreeningResult).values({
      resumeText: resumeToStore,
      vacancyText: vacancyToStore,
      score: Math.round(object.score),
      strengths: strengthsToStore,
      risks: risksToStore,
      interviewQuestions: questionsToStore,
    });

    return jsonResponse(object, 200, {
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": String(
        Math.max(0, RATE_LIMIT_MAX - (rateLimitMap.get(ip)?.count ?? 0)),
      ),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorName = err instanceof Error ? err.name : undefined;
    const causeMessage =
      err instanceof Error && err.cause instanceof Error
        ? err.cause.message
        : undefined;
    console.error("CVScore screening error:", {
      error: errorMessage,
      cause: causeMessage,
      ip,
      timestamp: new Date().toISOString(),
    });

    const isTimeout =
      (err instanceof Error &&
        (errorName === "AbortError" ||
          errorName === "TimeoutError" ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("aborted"))) ||
      false;

    if (isTimeout) {
      return jsonResponse(
        {
          error: "Превышено время ожидания",
          message:
            "Запрос занял слишком много времени. Попробуйте сократить текст.",
        },
        504,
      );
    }

    const isDbSchemaError =
      errorMessage.includes("does not exist") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("uuid_generate_v7");
    if (isDbSchemaError) {
      console.error(
        "[CVScore] Миграции не применены. Выполните: cd packages/db && bun run migrate:cvscore",
      );
      return jsonResponse(
        {
          error: "Ошибка базы данных",
          message: "Сервис временно недоступен. Обратитесь к администратору.",
        },
        503,
      );
    }

    return jsonResponse(
      {
        error: "Ошибка обработки",
        message: "Сервис временно недоступен. Попробуйте позже.",
      },
      500,
    );
  }
}
