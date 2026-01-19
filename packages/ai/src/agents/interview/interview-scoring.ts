/**
 * Агент для оценки интервью
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export type InterviewScoringInput = Record<string, never>;

const interviewScoringOutputSchema = z.object({
  score: z.number().min(1).max(5),
  detailedScore: z.number().min(0).max(100),
  analysis: z.string(),
  botUsageDetected: z.number().min(0).max(100),
});

export type InterviewScoringOutput = z.infer<
  typeof interviewScoringOutputSchema
>;

export class InterviewScoringAgent extends BaseAgent<
  InterviewScoringInput,
  InterviewScoringOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по оценке интервью с кандидатами.

ЗАДАЧА:
Проанализируй ответы кандидата и выстави оценку.

КРИТЕРИИ ОЦЕНКИ:
1. Полнота ответов (0-25 баллов)
2. Релевантность опыта (0-25 баллов)
3. Мотивация и заинтересованность (0-25 баллов)
4. Коммуникативные навыки (0-25 баллов)

ШКАЛА ОЦЕНОК:
- 5/5 (90-100): Отличный кандидат, рекомендуется к найму
- 4/5 (70-89): Хороший кандидат, стоит рассмотреть
- 3/5 (50-69): Средний кандидат, требуется дополнительная оценка
- 2/5 (30-49): Слабый кандидат, не рекомендуется
- 1/5 (0-29): Очень слабый кандидат, отказ

ДЕТЕКЦИЯ ИСПОЛЬЗОВАНИЯ AI-БОТОВ:
Оцени вероятность (0-100), что кандидат использовал AI-бота для ответов.

Признаки использования бота:
- Слишком идеальные, структурированные ответы без естественных пауз
- Шаблонные фразы и формальный стиль (например, "Безусловно", "В заключение хочу отметить")
- Отсутствие естественных речевых ошибок, оговорок, повторов
- Чрезмерно подробные ответы на простые вопросы
- Использование сложных конструкций и терминологии, не характерных для устной речи
- Ответы звучат как статьи или эссе, а не живой диалог
- Отсутствие эмоциональной окраски и личных примеров

Шкала botUsageDetected:
- 0-20: Естественные ответы, бот не использовался
- 21-40: Некоторые признаки, но скорее всего человек
- 41-60: Умеренная вероятность использования бота
- 61-80: Высокая вероятность использования бота
- 81-100: Почти наверняка использовался бот`;

    super(
      "InterviewScoring",
      AgentType.EVALUATOR,
      instructions,
      interviewScoringOutputSchema,
      config,
    );
  }

  protected validate(_input: InterviewScoringInput): boolean {
    // Валидация не требуется - используем conversationHistory из context
    return true;
  }

  protected buildPrompt(
    _input: InterviewScoringInput,
    context: BaseAgentContext,
  ): string {
    const {
      candidateName,
      vacancyTitle,
      vacancyDescription,
      conversationHistory,
    } = context;

    // Извлекаем пары вопрос-ответ из истории диалога
    const qaText = (conversationHistory || [])
      .filter((msg) => msg.sender === "BOT" || msg.sender === "CANDIDATE")
      .reduce(
        (acc, msg, idx, arr) => {
          // Если это сообщение от бота и следующее от кандидата - это пара вопрос-ответ
          const nextMsg = arr[idx + 1];
          if (msg.sender === "BOT" && nextMsg?.sender === "CANDIDATE") {
            acc.push({
              question: msg.content,
              answer: nextMsg.content,
            });
          }
          return acc;
        },
        [] as Array<{ question: string; answer: string }>,
      )
      .map(
        (qa, i) => `${i + 1}. Вопрос: ${qa.question}\n   Ответ: ${qa.answer}`,
      )
      .join("\n\n");

    return `КОНТЕКСТ:
${candidateName ? `Кандидат: ${candidateName}` : ""}
${vacancyTitle ? `Вакансия: ${vacancyTitle}` : ""}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}

ВОПРОСЫ И ОТВЕТЫ:
${qaText}

Оцени интервью по критериям выше.

Верни JSON с полями:
- score: оценка от 1 до 5
- detailedScore: детальная оценка от 0 до 100
- analysis: текстовый анализ в формате HTML (используй <p>, <strong>, <br>)
- botUsageDetected: вероятность использования AI-бота (0-100)`;
  }
}
