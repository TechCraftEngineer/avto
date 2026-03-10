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
    .min(
      RESUME_MIN_CHARS,
      `Резюме должно содержать минимум ${RESUME_MIN_CHARS} символов`,
    )
    .max(RESUME_MAX_CHARS),
  vacancy: z
    .string()
    .min(
      VACANCY_MIN_CHARS,
      `Вакансия должна содержать минимум ${VACANCY_MIN_CHARS} символов`,
    )
    .max(VACANCY_MAX_CHARS),
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

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
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

  const { resume, vacancy } = parsed.data;

  try {
    const prompt = buildScreeningPrompt(resume, vacancy);

    const { object } = await generateObject({
      model: undefined,
      prompt,
      schema: screeningOutputSchema,
      generationName: "cvscore-screening",
      metadata: { source: "cvscore" },
    });

    await cvscoreDb.insert(cvscoreScreeningResult).values({
      resumeText: resume.slice(0, RESUME_MAX_CHARS),
      vacancyText: vacancy.slice(0, VACANCY_MAX_CHARS),
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
