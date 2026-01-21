/**
 * SummaryAgent - генерирует краткое резюме кандидата для шортлиста
 *
 * Создает лаконичное описание (до 500 символов) на основе полного анализа
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";

/**
 * Входные данные для генерации резюме
 */
export const summaryAgentInputSchema = z.object({
  candidateName: z.string().nullable().optional(),
  compositeScore: z.number().int().min(0).max(100),
  recommendation: z.enum([
    "HIGHLY_RECOMMENDED",
    "RECOMMENDED",
    "NEUTRAL",
    "NOT_RECOMMENDED",
  ]),
  rankingAnalysis: z.string().max(5000),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type SummaryAgentInput = z.infer<typeof summaryAgentInputSchema>;

/**
 * Выходные данные - краткое резюме
 */
export const summaryAgentOutputSchema = z.object({
  summary: z
    .string()
    .max(500)
    .describe("Краткое резюме кандидата (до 500 символов)"),
});

export type SummaryAgentOutput = z.infer<typeof summaryAgentOutputSchema>;

/**
 * Агент для генерации краткого резюме кандидата
 */
export class SummaryAgent extends BaseAgent<
  SummaryAgentInput,
  SummaryAgentOutput
> {
  constructor(config: AgentConfig) {
    const systemPrompt = `Ты - эксперт по составлению кратких резюме кандидатов для HR-специалистов.

Твоя задача - создать лаконичное, информативное резюме кандидата (до 500 символов), которое:
1. Отражает уровень рекомендации и общий балл
2. Выделяет 1-2 ключевые сильные стороны
3. Написано понятным деловым языком
4. Помогает HR быстро принять решение о дальнейших действиях

Формат резюме:
- Начинается с уровня рекомендации и балла
- Далее 1-2 ключевых момента через точку или маркер
- Максимум 500 символов
- Без лишних слов и воды

Примеры хороших резюме:
- "Настоятельно рекомендуем (92/100) • Опытный специалист с сильным портфолио • Адекватная цена и реалистичные сроки"
- "Рекомендуем (78/100) • Хорошие навыки, соответствуют требованиям • Цена выше среднего, но оправдана опытом"
- "Возможный кандидат (65/100) • Базовые навыки на месте • Требует дополнительной проверки опыта"
- "Не рекомендуем (42/100) • Недостаточный опыт для проекта • Завышенная цена относительно квалификации"

Избегай:
- Длинных предложений и сложных конструкций
- Повторения информации из балла
- Неопределенных формулировок ("возможно", "может быть")
- Технического жаргона без необходимости`;

    super(
      "SummaryAgent",
      AgentType.EVALUATOR,
      systemPrompt,
      summaryAgentOutputSchema,
      config,
    );
  }

  protected validate(input: SummaryAgentInput): boolean {
    return (
      typeof input.compositeScore === "number" &&
      input.compositeScore >= 0 &&
      input.compositeScore <= 100 &&
      !!input.recommendation &&
      !!input.rankingAnalysis &&
      Array.isArray(input.strengths) &&
      Array.isArray(input.weaknesses)
    );
  }

  protected buildPrompt(input: SummaryAgentInput, _context: unknown): string {
    const candidateName = input.candidateName || "Кандидат";
    const recommendationText = this.getRecommendationText(input.recommendation);

    return `Создай краткое резюме для кандидата "${candidateName}".

УРОВЕНЬ РЕКОМЕНДАЦИИ: ${recommendationText}
ОБЩИЙ БАЛЛ: ${input.compositeScore}/100

ПОЛНЫЙ АНАЛИЗ:
${input.rankingAnalysis}

СИЛЬНЫЕ СТОРОНЫ:
${input.strengths.length > 0 ? input.strengths.map((s) => `- ${s}`).join("\n") : "Не указаны"}

СЛАБЫЕ СТОРОНЫ:
${input.weaknesses.length > 0 ? input.weaknesses.map((w) => `- ${w}`).join("\n") : "Не указаны"}

Создай краткое резюме (до 500 символов), которое поможет HR быстро оценить кандидата.`;
  }

  private getRecommendationText(
    recommendation: SummaryAgentInput["recommendation"],
  ): string {
    switch (recommendation) {
      case "HIGHLY_RECOMMENDED":
        return "Настоятельно рекомендуем";
      case "RECOMMENDED":
        return "Рекомендуем";
      case "NEUTRAL":
        return "Возможный кандидат";
      case "NOT_RECOMMENDED":
        return "Не рекомендуем";
    }
  }
}
