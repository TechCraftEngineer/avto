/**
 * Агент для генерации рекомендаций по исполнителям на задания (gig)
 */

import { z } from "zod";
import type { AgentConfig } from "../../core/base-agent";
import { BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";

/**
 * Системный промпт для агента рекомендаций по заданиям
 */
const GIG_RECOMMENDATION_SYSTEM_PROMPT = `Ты — эксперт по оценке исполнителей для фриланс-заданий. На основе результатов скрининга формируешь детальные рекомендации по исполнителям.

Твоя задача:
1. Проанализировать результаты скрининга исполнителя
2. Оценить соответствие требованиям задания
3. Оценить адекватность предложенной цены и сроков
4. Выявить сильные и слабые стороны
5. Сформировать рекомендацию и предложить конкретные действия

Критерии оценки:
- HIGHLY_RECOMMENDED: detailedScore >= 80, отличное соответствие, адекватная цена и сроки
- RECOMMENDED: detailedScore >= 60, хорошее соответствие с незначительными замечаниями
- NEUTRAL: detailedScore >= 40, среднее соответствие, требуется дополнительное обсуждение
- NOT_RECOMMENDED: detailedScore < 40, критические несоответствия или неадекватные условия

Важно:
- Фокусируйся на конкретных фактах из опыта и скрининга
- Будь объективным и справедливым
- Оцени реалистичность предложенных цены и сроков
- Предлагай конструктивные действия`;

/**
 * Схема для данных задания (gig) (для рекомендаций)
 */
export const GigRecommendationGigDataSchema = z.object({
  title: z.string().min(1, "Название задания обязательно"),
  description: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  budget: z
    .object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    })
    .nullable()
    .optional(),
  deliveryDays: z.number().positive().int().nullable().optional(),
});

export type GigRecommendationGigData = z.infer<
  typeof GigRecommendationGigDataSchema
>;

/**
 * Схема для данных исполнителя (gig-специфичная)
 */
export const GigRecommendationCandidateDataSchema = z.object({
  name: z.string().nullable().default(null),
  experience: z.string().nullable().default(null),
  skills: z.array(z.string()).nullable().default(null),
  coverLetter: z.string().nullable().default(null),
  proposedPrice: z.number().positive().nullable().default(null),
  proposedDeliveryDays: z.number().positive().int().nullable().default(null),
});

export type GigRecommendationCandidateData = z.infer<
  typeof GigRecommendationCandidateDataSchema
>;

/**
 * Схема для данных скрининга (для рекомендаций)
 */
export const GigRecommendationScreeningDataSchema = z.object({
  score: z
    .number()
    .min(0, "Оценка не может быть отрицательной")
    .max(5, "Максимальная оценка 5"),
  detailedScore: z
    .number()
    .min(0, "Детальная оценка не может быть отрицательной")
    .max(100, "Максимальная детальная оценка 100"),
  analysis: z.string().min(1, "Анализ обязателен"),
  matchPercentage: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  summary: z.string().optional(),
});

export type GigRecommendationScreeningData = z.infer<
  typeof GigRecommendationScreeningDataSchema
>;

/**
 * Схема результата рекомендации для задания
 */
export const GigRecommendationOutputSchema = z.object({
  recommendation: z.enum([
    "HIGHLY_RECOMMENDED",
    "RECOMMENDED",
    "NEUTRAL",
    "NOT_RECOMMENDED",
  ]),
  strengths: z
    .array(z.string().min(1, "Сильная сторона не может быть пустой"))
    .min(1, "Необходимо указать хотя бы одну сильную сторону")
    .max(5, "Максимум 5 сильных сторон"),
  weaknesses: z
    .array(z.string().min(1, "Слабая сторона не может быть пустой"))
    .max(5, "Максимум 5 слабых сторон")
    .default([]),
  candidateSummary: z
    .string()
    .min(10, "Резюме исполнителя слишком короткое")
    .max(500, "Резюме исполнителя не должно превышать 500 символов"),
  actionSuggestions: z
    .array(z.string().min(1, "Рекомендация не может быть пустой"))
    .min(1, "Необходимо указать хотя бы одну рекомендацию")
    .max(3, "Максимум 3 рекомендации"),
  interviewQuestions: z
    .array(z.string().min(1, "Вопрос не может быть пустым"))
    .max(3, "Максимум 3 вопроса")
    .default([]),
  riskFactors: z
    .array(z.string().min(1, "Фактор риска не может быть пустым"))
    .max(3, "Максимум 3 фактора риска")
    .default([]),
  budgetAssessment: z
    .object({
      isReasonable: z.boolean(),
      comment: z.string().optional(),
    })
    .optional(),
  deliveryAssessment: z
    .object({
      isRealistic: z.boolean(),
      comment: z.string().optional(),
    })
    .optional(),
});

export type GigRecommendationOutput = z.infer<
  typeof GigRecommendationOutputSchema
>;

/**
 * Входные данные для генерации рекомендации
 */
export const GigRecommendationInputSchema = z.object({
  gig: GigRecommendationGigDataSchema,
  candidate: GigRecommendationCandidateDataSchema,
  screening: GigRecommendationScreeningDataSchema,
});

export type GigRecommendationInput = z.infer<
  typeof GigRecommendationInputSchema
>;

/**
 * Агент для генерации рекомендаций по исполнителям на задания
 */
export class GigRecommendationAgent extends BaseAgent<
  GigRecommendationInput,
  GigRecommendationOutput
> {
  constructor(config: AgentConfig) {
    super(
      "GigRecommendation",
      AgentType.EVALUATOR,
      GIG_RECOMMENDATION_SYSTEM_PROMPT,
      GigRecommendationOutputSchema,
      config,
      GigRecommendationInputSchema,
    );
  }

  protected buildPrompt(
    input: GigRecommendationInput,
    _context: unknown,
  ): string {
    const { gig, candidate, screening } = input;

    const candidateName = candidate.name || "Имя не указано";
    const candidateExperience = candidate.experience || "Не указан";
    const candidateSkills = candidate.skills?.length
      ? `Навыки: ${candidate.skills.join(", ")}`
      : "";
    const candidateCoverLetter = candidate.coverLetter
      ? `Сопроводительное письмо: ${candidate.coverLetter}`
      : "";
    const candidatePrice = candidate.proposedPrice
      ? `Предложенная цена: ${candidate.proposedPrice}`
      : "";

    const gigDescription = gig.description
      ? `Описание: ${gig.description}`
      : "";
    const gigRequirements = gig.requirements.length
      ? `Требования:\n${gig.requirements.map((r) => `- ${r}`).join("\n")}`
      : "";
    const gigBudget =
      gig.budget?.min || gig.budget?.max
        ? `Бюджет: ${gig.budget.min || "не указан"} - ${gig.budget.max || "не указан"}`
        : "";
    const gigDelivery = gig.deliveryDays
      ? `Срок выполнения (требуемый): ${gig.deliveryDays} дней`
      : "";
    const candidateDelivery = candidate.proposedDeliveryDays
      ? `Срок выполнения (предложенный): ${candidate.proposedDeliveryDays} дней`
      : "";

    const screeningMatchPercentage = screening.matchPercentage
      ? `- Процент соответствия: ${screening.matchPercentage}%`
      : "";
    const screeningStrengths = screening.strengths.length
      ? `- Сильные стороны: ${screening.strengths.join(", ")}`
      : "";
    const screeningWeaknesses = screening.weaknesses.length
      ? `- Слабые стороны: ${screening.weaknesses.join(", ")}`
      : "";

    return `Ты — эксперт по оценке исполнителей для фриланс-заданий. На основе результатов скрининга сформируй детальную рекомендацию по исполнителю.

ЗАДАНИЕ: ${gig.title}
${gigDescription}
${gigRequirements}
${gigBudget}
${gigDelivery}

ИСПОЛНИТЕЛЬ: ${candidateName}

Опыт работы:
${candidateExperience}

${candidateSkills}
${candidateCoverLetter}
${candidatePrice}
${candidateDelivery}

РЕЗУЛЬТАТЫ СКРИНИНГА:
- Общая оценка: ${screening.score}/5
- Детальная оценка: ${screening.detailedScore}/100
${screeningMatchPercentage}
- Анализ: ${screening.analysis}
${screeningStrengths}
${screeningWeaknesses}

ЗАДАЧА:
Сформируй рекомендацию по исполнителю для задания. Обрати особое внимание на:
1. Соответствие навыков требованиям задания
2. Адекватность предложенной цены бюджету
3. Реалистичность предложенных сроков
4. Опыт выполнения похожих заданий

КРИТЕРИИ ОЦЕНКИ:
- HIGHLY_RECOMMENDED: detailedScore >= 80, отличное соответствие, адекватная цена и сроки
- RECOMMENDED: detailedScore >= 60, хорошее соответствие с незначительными замечаниями
- NEUTRAL: detailedScore >= 40, среднее соответствие, требуется дополнительное обсуждение
- NOT_RECOMMENDED: detailedScore < 40, критические несоответствия или неадекватные условия

ФОРМАТ ОТВЕТА (только JSON):
{
  "recommendation": "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "NEUTRAL" | "NOT_RECOMMENDED",
  "strengths": ["сильная сторона 1", "сильная сторона 2", ...],
  "weaknesses": ["слабая сторона 1", ...],
  "candidateSummary": "Краткое резюме исполнителя (1-2 предложения, макс 500 символов)",
  "actionSuggestions": ["рекомендуемое действие 1", "рекомендуемое действие 2"],
  "interviewQuestions": ["вопрос для обсуждения 1", ...],
  "riskFactors": ["потенциальный риск 1", ...],
  "budgetAssessment": {
    "isReasonable": true/false,
    "comment": "комментарий по бюджету"
  },
  "deliveryAssessment": {
    "isRealistic": true/false,
    "comment": "комментарий по срокам"
  }
}

ВАЖНО:
- strengths: 1-5 пунктов, конкретные преимущества исполнителя
- weaknesses: 0-5 пунктов, конкретные недостатки или риски
- candidateSummary: краткое, информативное резюме для быстрого принятия решения
- actionSuggestions: 1-3 конкретных действия (принять предложение, обсудить условия, отклонить и т.д.)
- interviewQuestions: 0-3 вопроса для уточнения деталей (опционально)
- riskFactors: 0-3 потенциальных риска при работе с исполнителем (опционально)
- budgetAssessment: оценка адекватности предложенной цены (опционально)
- deliveryAssessment: оценка реалистичности сроков (опционально)`;
  }
}
