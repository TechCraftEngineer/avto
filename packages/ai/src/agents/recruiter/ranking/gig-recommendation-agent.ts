/**
 * Агент для генерации рекомендаций по исполнителям на задания (gig)
 */

import { generateObject } from "ai";
import { z } from "zod";
import { BaseAgent } from "../../core/base-agent";

/**
 * Схема для данных задания (gig)
 */
export const GigDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  budget: z
    .object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    })
    .nullable()
    .optional(),
  deliveryDays: z.number().positive().int().nullable().optional(),
});

export type GigData = z.infer<typeof GigDataSchema>;

/**
 * Схема для данных исполнителя (gig-специфичная)
 */
export const GigCandidateDataSchema = z.object({
  name: z.string().nullable(),
  experience: z.string().nullable(),
  skills: z.array(z.string()).nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  proposedPrice: z.number().positive().nullable().optional(),
  proposedDeliveryDays: z.number().positive().int().nullable().optional(),
});

export type GigCandidateData = z.infer<typeof GigCandidateDataSchema>;

/**
 * Схема для данных скрининга
 */
export const ScreeningDataSchema = z.object({
  score: z.number().min(0).max(5),
  detailedScore: z.number().min(0).max(100),
  analysis: z.string(),
  matchPercentage: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

export type ScreeningData = z.infer<typeof ScreeningDataSchema>;

/**
 * Схема результата рекомендации для задания
 */
export const GigRecommendationSchema = z.object({
  recommendation: z.enum([
    "HIGHLY_RECOMMENDED",
    "RECOMMENDED",
    "NEUTRAL",
    "NOT_RECOMMENDED",
  ]),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).max(5),
  candidateSummary: z.string().max(500),
  actionSuggestions: z.array(z.string()).min(1).max(3),
  interviewQuestions: z.array(z.string()).max(3).default([]),
  riskFactors: z.array(z.string()).max(3).default([]),
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

export type GigRecommendation = z.infer<typeof GigRecommendationSchema>;

/**
 * Входные данные для генерации рекомендации
 */
export interface GigRecommendationInput {
  gig: GigData;
  candidate: GigCandidateData;
  screening: ScreeningData;
}

/**
 * Агент для генерации рекомендаций по исполнителям на задания
 */
export class GigRecommendationAgent extends BaseAgent<
  GigRecommendationInput,
  GigRecommendation
> {
  protected agentName = "gig-recommendation";
  private config: { model: any };

  constructor(
    name: string,
    type: any,
    instructions: string,
    outputSchema: any,
    config: any,
  ) {
    super(name, type, instructions, outputSchema, config);
    this.config = config;
  }

  protected buildPrompt(
    input: GigRecommendationInput,
    context: unknown,
  ): string {
    return this.buildRecommendationPrompt(input);
  }

  /**
   * Построение промпта для генерации рекомендации
   */
  private buildRecommendationPrompt(input: GigRecommendationInput): string {
    const { gig, candidate, screening } = input;

    const budgetInfo =
      gig.budget?.min || gig.budget?.max
        ? `Бюджет: ${gig.budget.min || "не указан"} - ${gig.budget.max || "не указан"}`
        : "";

    const candidatePriceInfo = candidate.proposedPrice
      ? `Предложенная цена: ${candidate.proposedPrice}`
      : "";

    const deliveryInfo = `
Срок выполнения (требуемый): ${gig.deliveryDays || "не указан"} дней
Срок выполнения (предложенный): ${candidate.proposedDeliveryDays || "не указан"} дней`;

    return `Ты — эксперт по оценке исполнителей для фриланс-заданий. На основе результатов скрининга сформируй детальную рекомендацию по исполнителю.

ЗАДАНИЕ: ${gig.title}
${gig.description ? `Описание: ${gig.description}` : ""}
${gig.requirements?.length ? `Требования:\n${gig.requirements.map((r) => `- ${r}`).join("\n")}` : ""}
${budgetInfo}
${deliveryInfo}

ИСПОЛНИТЕЛЬ: ${candidate.name || "Имя не указано"}

Опыт работы:
${candidate.experience || "Не указан"}

${candidate.skills?.length ? `Навыки: ${candidate.skills.join(", ")}` : ""}
${candidate.coverLetter ? `Сопроводительное письмо: ${candidate.coverLetter}` : ""}
${candidatePriceInfo}

РЕЗУЛЬТАТЫ СКРИНИНГА:
- Общая оценка: ${screening.score}/5
- Детальная оценка: ${screening.detailedScore}/100
${screening.matchPercentage ? `- Процент соответствия: ${screening.matchPercentage}%` : ""}
- Анализ: ${screening.analysis}
${screening.strengths?.length ? `- Сильные стороны: ${screening.strengths.join(", ")}` : ""}
${screening.weaknesses?.length ? `- Слабые стороны: ${screening.weaknesses.join(", ")}` : ""}

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

  /**
   * Выполнение генерации рекомендации
   */
  async execute(
    input: GigRecommendationInput,
    context: unknown = {},
  ): Promise<{ success: boolean; data?: GigRecommendation; error?: string }> {
    try {
      const prompt = this.buildRecommendationPrompt(input);

      const result = await generateObject({
        model: this.config.model,
        schema: GigRecommendationSchema,
        prompt,
        abortSignal: AbortSignal.timeout(60_000),
      });

      return {
        success: true,
        data: result.object,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
