import { z } from "zod";

/** Мин. символов для резюме (валидация API) */
export const RESUME_MIN_CHARS = 50;

/** Макс. символов для резюме (чтобы уложиться в 10–20 сек) */
export const RESUME_MAX_CHARS = 15_000;

/** Мин. символов для вакансии (валидация API) */
export const VACANCY_MIN_CHARS = 30;

/** Макс. символов для вакансии */
export const VACANCY_MAX_CHARS = 5_000;

export const screeningOutputSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().max(300)).min(1).max(8),
  risks: z.array(z.string().max(300)).min(0).max(8),
  interviewQuestions: z.array(z.string().max(400)).min(3).max(8),
});

export type ScreeningOutput = z.infer<typeof screeningOutputSchema>;

export function buildScreeningPrompt(
  resumeText: string,
  vacancyText: string,
): string {
  return `Ты эксперт по подбору персонала. Оцени резюме кандидата на соответствие требованиям вакансии.

ВАКАНСИЯ:
${vacancyText}

РЕЗЮМЕ КАНДИДАТА:
${resumeText}

ЗАДАЧА:
1. Оцени соответствие кандидата вакансии по шкале 0–100 (score)
2. Выдели 3–6 сильных сторон кандидата
3. Выдели 0–5 рисков или слабых сторон
4. Предложи 4–6 конкретных вопросов для интервью, которые помогут проверить ключевые моменты

Правила:
- Сильные стороны — что говорит в пользу кандидата
- Риски — пробелы, неясности, потенциальные проблемы
- Вопросы должны быть практичными и направленными на выяснение рисков или проверку заявленных компетенций
- Отвечай только на русском языке`;
}
