/**
 * Агент для генерации рекомендаций по кандидатам на вакансии
 */

import { generateObject } from "ai";
import { z } from "zod";
import { BaseAgent } from "../../core/base-agent";

/**
 * Схема для данных вакансии
 */
export const VacancyDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

export type VacancyData = z.infer<typeof VacancyDataSchema>;

/**
 * Схема для данных кандидата (vacancy-специфичная)
 */
export const VacancyCandidateDataSchema = z.object({
  name: z.string().nullable(),
  experience: z.string().nullable(),
  skills: z.array(z.string()).nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  salaryExpectations: z.number().positive().nullable().optional(),
});

export type VacancyCandidateData = z.infer<typeof VacancyCandidateDataSchema>;

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
 * Схема результата рекомендации для вакансии
 */
export const VacancyRecommendationSchema = z.object({
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
});

export type VacancyRecommendation = z.infer<typeof VacancyRecommendationSchema>;

/**
 * Входные данные для генерации рекомендации
 */
export interface VacancyRecommendationInput {
  vacancy: VacancyData;
  candidate: VacancyCandidateData;
  screening: ScreeningData;
}

/**
 * Агент для генерации рекомендаций по кандидатам на вакансии
 */
export class VacancyRecommendationAgent extends BaseAgent<
  VacancyRecommendationInput,
  VacancyRecommendation
> {
  protected agentName = "vacancy-recommendation";
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
    input: VacancyRecommendationInput,
    context: unknown,
  ): string {
    return this.buildRecommendationPrompt(input);
  }

  /**
   * Построение промпта для генерации рекомендации
   */
  private buildRecommendationPrompt(input: VacancyRecommendationInput): string {
    const { vacancy, candidate, screening } = input;

    const candidatePriceInfo = candidate.salaryExpectations
      ? `Зарплатные ожидания: ${candidate.salaryExpectations}`
      : "";

    return `Ты — эксперт HR-аналитик. На основе результатов скрининга сформируй детальную рекомендацию по кандидату на вакансию.

ВАКАНСИЯ: ${vacancy.title}
${vacancy.description ? `Описание: ${vacancy.description}` : ""}
${vacancy.requirements?.length ? `Требования:\n${vacancy.requirements.map((r) => `- ${r}`).join("\n")}` : ""}

КАНДИДАТ: ${candidate.name || "Имя не указано"}

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
Сформируй рекомендацию по кандидату на вакансию.

КРИТЕРИИ ОЦЕНКИ:
- HIGHLY_RECOMMENDED: detailedScore >= 80, отличное соответствие всем ключевым требованиям
- RECOMMENDED: detailedScore >= 60, хорошее соответствие с незначительными пробелами
- NEUTRAL: detailedScore >= 40, среднее соответствие, требуется дополнительная оценка
- NOT_RECOMMENDED: detailedScore < 40, критические несоответствия

ФОРМАТ ОТВЕТА (только JSON):
{
  "recommendation": "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "NEUTRAL" | "NOT_RECOMMENDED",
  "strengths": ["сильная сторона 1", "сильная сторона 2", ...],
  "weaknesses": ["слабая сторона 1", ...],
  "candidateSummary": "Краткое резюме кандидата (1-2 предложения, макс 500 символов)",
  "actionSuggestions": ["рекомендуемое действие 1", "рекомендуемое действие 2"],
  "interviewQuestions": ["вопрос для интервью 1", ...],
  "riskFactors": ["потенциальный риск 1", ...]
}

ВАЖНО:
- strengths: 1-5 пунктов, конкретные преимущества кандидата
- weaknesses: 0-5 пунктов, конкретные недостатки или пробелы
- candidateSummary: краткое, информативное резюме для быстрого принятия решения
- actionSuggestions: 1-3 конкретных действия (пригласить на интервью, запросить портфолио, отклонить и т.д.)
- interviewQuestions: 0-3 вопроса для уточнения на интервью (опционально)
- riskFactors: 0-3 потенциальных риска при найме (опционально)`;
  }

  /**
   * Выполнение генерации рекомендации
   */
  async execute(
    input: VacancyRecommendationInput,
    context: unknown = {},
  ): Promise<{
    success: boolean;
    data?: VacancyRecommendation;
    error?: string;
  }> {
    try {
      const prompt = this.buildRecommendationPrompt(input);

      const result = await generateObject({
        model: this.config.model,
        schema: VacancyRecommendationSchema,
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
