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

const requestSchema = z.object({
  resume: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (s) => s.length >= RESUME_MIN_CHARS,
      `Резюме должно содержать минимум ${RESUME_MIN_CHARS} символов`,
    )
    .refine(
      (s) => s.length <= RESUME_MAX_CHARS,
      `Резюме должно содержать не более ${RESUME_MAX_CHARS} символов`,
    ),
  vacancy: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (s) => s.length >= VACANCY_MIN_CHARS,
      `Вакансия должна содержать минимум ${VACANCY_MIN_CHARS} символов`,
    )
    .refine(
      (s) => s.length <= VACANCY_MAX_CHARS,
      `Вакансия должна содержать не более ${VACANCY_MAX_CHARS} символов`,
    ),
  consentToStore: z.boolean().optional().default(true),
});

/** Простой in-memory rate limit: IP -> { count, resetAt } */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 минута
const RATE_LIMIT_MAX = 5; // макс. 5 запросов в минуту

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Удаляет устаревшие записи из rateLimitMap для предотвращения утечки памяти */
function pruneExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  pruneExpiredRateLimits();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateResult = checkRateLimit(ip);

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: "Превышен лимит запросов",
        message: `Попробуйте снова через ${rateResult.retryAfter} секунд`,
      },
      {
        status: 429,
        headers: rateResult.retryAfter
          ? { "Retry-After": String(rateResult.retryAfter) }
          : undefined,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: "Ошибка валидации",
        message: firstError?.message ?? "Проверьте введённые данные",
      },
      { status: 400 },
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
      metadata: { source: "cvscore" },
    });

    const resumeToStore = consentToStore
      ? resume.slice(0, RESUME_MAX_CHARS)
      : "[скрининг без сохранения резюме — нет согласия]";
    const vacancyToStore = consentToStore
      ? vacancy.slice(0, VACANCY_MAX_CHARS)
      : "[описание вакансии не сохранено — нет согласия]";

    await cvscoreDb.insert(cvscoreScreeningResult).values({
      resumeText: resumeToStore,
      vacancyText: vacancyToStore,
      score: object.score,
      strengths: object.strengths,
      risks: object.risks,
      interviewQuestions: object.interviewQuestions,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("CVScore screening error:", err);
    return NextResponse.json(
      {
        error: "Ошибка AI",
        message: "Сервис временно недоступен. Попробуйте позже.",
      },
      { status: 500 },
    );
  }
}
