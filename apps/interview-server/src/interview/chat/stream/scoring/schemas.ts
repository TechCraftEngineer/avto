import { z } from "zod";

/**
 * Схема оценки для разовых заданий (gig)
 * Версия: v3-gig
 */
export const gigScoringSchema = z.object({
  // Основные критерии оценки
  strengths_weaknesses: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Оценка сильных и слабых сторон кандидата"),

  expertise_depth: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Глубина экспертизы в требуемой области"),

  problem_solving: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Способность решать проблемы и подход к задачам"),

  communication_quality: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Качество коммуникации и ясность изложения"),

  timeline_feasibility: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Реалистичность предложенных сроков выполнения"),

  // Штраф за подозрение в использовании ботов
  authenticityPenalty: z
    .number()
    .min(0)
    .max(5)
    .default(0)
    .describe("Штраф за признаки автоматизированных ответов (0-5)"),

  // Метаданные
  metadata: z.object({
    version: z.literal("v3-gig"),
    evaluatedAt: z.string().datetime().optional(),
  }),

  // Итоговая сводка
  summary: z.object({
    keyTakeaways: z.array(z.string()).describe("Ключевые выводы о кандидате"),
    redFlags: z.array(z.string()).describe("Тревожные сигналы"),
    greenFlags: z.array(z.string()).describe("Положительные индикаторы"),
  }),
});

export type GigScoring = z.infer<typeof gigScoringSchema>;

/**
 * Схема оценки для вакансий (vacancy)
 * Версия: v2
 */
export const vacancyScoringSchema = z.object({
  // Основные критерии оценки
  completeness: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Полнота ответов на вопросы"),

  relevance: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Релевантность опыта и навыков требованиям вакансии"),

  motivation: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Мотивация и заинтересованность в позиции"),

  communication: z
    .object({
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
    .describe("Качество коммуникации и профессионализм"),

  // Штраф за подозрение в использовании ботов
  authenticityPenalty: z
    .number()
    .min(0)
    .max(5)
    .default(0)
    .describe("Штраф за признаки автоматизированных ответов (0-5)"),

  // Метаданные
  metadata: z.object({
    version: z.literal("v2"),
    evaluatedAt: z.string().datetime().optional(),
  }),

  // Итоговая сводка
  summary: z.object({
    keyTakeaways: z.array(z.string()).describe("Ключевые выводы о кандидате"),
    concerns: z.array(z.string()).describe("Опасения и вопросы"),
    positives: z.array(z.string()).describe("Сильные стороны"),
  }),
});

export type VacancyScoring = z.infer<typeof vacancyScoringSchema>;
