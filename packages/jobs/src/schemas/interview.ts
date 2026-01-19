import { z } from "zod";

/**
 * Схема для анализа ответа кандидата и генерации следующего вопроса
 */
export const interviewAnalysisSchema = z.object({
  analysis: z
    .string()
    .describe("Краткая оценка ответа кандидата в 1-2 предложения"),
  shouldContinue: z.boolean().describe("Стоит ли задавать следующий вопрос"),
  reason: z
    .string()
    .optional()
    .nullable()
    .describe("Причина завершения интервью, если shouldContinue=false"),
  nextQuestion: z
    .string()
    .optional()
    .describe("Следующий вопрос кандидату, если shouldContinue=true"),
});

/**
 * Схема для финального скоринга интервью
 */
export const interviewScoringSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Оценка от 0 до 100, где 0 - совсем не подходит, 100 - отлично подходит",
    ),
  analysis: z
    .string()
    .describe("Подробный анализ кандидата на основе интервью, 3-5 предложений"),
  botUsageDetected: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Вероятность использования AI-бота для ответов (0-100). Признаки: слишком идеальные ответы, шаблонные фразы, отсутствие естественных пауз/ошибок, формальный стиль",
    ),
});

// Типы
export type InterviewAnalysis = z.infer<typeof interviewAnalysisSchema>;
export type InterviewScoring = z.infer<typeof interviewScoringSchema>;
