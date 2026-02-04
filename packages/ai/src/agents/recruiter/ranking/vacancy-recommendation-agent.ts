/**
 * Агент для генерации рекомендаций по кандидатам на вакансии
 */

import { z } from "zod";
import type { AgentConfig } from "../../core/base-agent";
import { BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";

/**
 * Системный промпт для агента рекомендаций
 */
const VACANCY_RECOMMENDATION_SYSTEM_PROMPT = `Ты — эксперт HR-аналитик. На основе результатов скрининга формируешь детальные рекомендации по кандидатам на вакансии.

Твоя задача:
1. Проанализировать результаты скрининга кандидата
2. Оценить соответствие требованиям вакансии
3. Выявить сильные и слабые стороны
4. Сформировать рекомендацию и предложить конкретные действия

Критерии оценки:
- HIGHLY_RECOMMENDED: detailedScore >= 80, отличное соответствие всем ключевым требованиям
- RECOMMENDED: detailedScore >= 60, хорошее соответствие с незначительными пробелами
- NEUTRAL: detailedScore >= 40, среднее соответствие, требуется дополнительная оценка
- NOT_RECOMMENDED: detailedScore < 40, критические несоответствия

Важно:
- Фокусируйся на конкретных фактах из резюме и скрининга
- Будь объективным и справедливым
- Предлагай конструктивные действия
- Учитывай потенциал кандидата, а не только текущий опыт`;

/**
 * Схема для данных вакансии (для рекомендаций)
 */
export const VacancyRecommendationVacancyDataSchema = z.object({
  title: z.string().min(1, "Название вакансии обязательно"),
  description: z.string().optional(),
  requirements: z.array(z.string()).default([]),
});

export type VacancyRecommendationVacancyData = z.infer<
  typeof VacancyRecommendationVacancyDataSchema
>;

/**
 * Схема для данных кандидата (vacancy-специфичная)
 */
export const VacancyRecommendationCandidateDataSchema = z.object({
  name: z.string().nullable().default(null),
  experience: z.string().nullable().default(null),
  skills: z.array(z.string()).nullable().default(null),
  coverLetter: z.string().nullable().default(null),
  salaryExpectations: z.number().positive().nullable().default(null),
});

export type VacancyRecommendationCandidateData = z.infer<
  typeof VacancyRecommendationCandidateDataSchema
>;

/**
 * Схема для данных скрининга (для рекомендаций)
 */
export const VacancyRecommendationScreeningDataSchema = z.object({
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

export type VacancyRecommendationScreeningData = z.infer<
  typeof VacancyRecommendationScreeningDataSchema
>;

/**
 * Схема для данных интервью (опционально)
 */
export const VacancyRecommendationInterviewDataSchema = z
  .object({
    score: z
      .number()
      .min(0, "Оценка интервью не может быть отрицательной")
      .max(100, "Максимальная оценка интервью 100"),
    rating: z
      .number()
      .min(0, "Рейтинг не может быть отрицательным")
      .max(5, "Максимальный рейтинг 5"),
    analysis: z.string().min(1, "Анализ интервью обязателен"),
    botUsageDetected: z.boolean(),
  })
  .optional();

export type VacancyRecommendationInterviewData = z.infer<
  typeof VacancyRecommendationInterviewDataSchema
>;

/**
 * Схема результата рекомендации для вакансии
 */
export const VacancyRecommendationOutputSchema = z.object({
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
    .min(10, "Резюме кандидата слишком короткое")
    .max(500, "Резюме кандидата не должно превышать 500 символов"),
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
});

export type VacancyRecommendationOutput = z.infer<
  typeof VacancyRecommendationOutputSchema
>;

/**
 * Входные данные для генерации рекомендации
 */
export const VacancyRecommendationInputSchema = z.object({
  vacancy: VacancyRecommendationVacancyDataSchema,
  candidate: VacancyRecommendationCandidateDataSchema,
  screening: VacancyRecommendationScreeningDataSchema,
  interview: VacancyRecommendationInterviewDataSchema,
});

export type VacancyRecommendationInput = z.infer<
  typeof VacancyRecommendationInputSchema
>;

/**
 * Агент для генерации рекомендаций по кандидатам на вакансии
 */
export class VacancyRecommendationAgent extends BaseAgent<
  VacancyRecommendationInput,
  VacancyRecommendationOutput
> {
  constructor(config: AgentConfig) {
    super(
      "VacancyRecommendation",
      AgentType.EVALUATOR,
      VACANCY_RECOMMENDATION_SYSTEM_PROMPT,
      VacancyRecommendationOutputSchema,
      config,
      VacancyRecommendationInputSchema,
    );
  }

  protected buildPrompt(
    input: VacancyRecommendationInput,
    _context: unknown,
  ): string {
    const { vacancy, candidate, screening, interview } = input;

    const candidateName = candidate.name || "Имя не указано";
    const candidateExperience = candidate.experience || "Не указан";
    const candidateSkills = candidate.skills?.length
      ? `Навыки: ${candidate.skills.join(", ")}`
      : "";
    const candidateCoverLetter = candidate.coverLetter
      ? `Сопроводительное письмо: ${candidate.coverLetter}`
      : "";
    const candidateSalary = candidate.salaryExpectations
      ? `Зарплатные ожидания: ${candidate.salaryExpectations}`
      : "";

    const vacancyDescription = vacancy.description
      ? `Описание: ${vacancy.description}`
      : "";
    const vacancyRequirements = vacancy.requirements.length
      ? `Требования:\n${vacancy.requirements.map((r) => `- ${r}`).join("\n")}`
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

    // Формируем секцию интервью, если оно было пройдено
    const interviewSection = interview
      ? `
РЕЗУЛЬТАТЫ ИНТЕРВЬЮ:
- Оценка интервью: ${interview.score}/100
- Рейтинг: ${interview.rating}/5
- Анализ: ${interview.analysis}
- Обнаружено использование ботов: ${interview.botUsageDetected ? "ДА ⚠️" : "НЕТ"}
${interview.botUsageDetected ? "\n⚠️ КРИТИЧНО: Кандидат использовал AI-бота для ответов на интервью. Это серьезный риск." : ""}
`
      : `
ИНТЕРВЬЮ: Не проводилось
⚠️ Рекомендация основана только на скрининге резюме. Для полной оценки требуется интервью.
`;

    return `Ты — эксперт HR-аналитик. На основе результатов скрининга${interview ? " и интервью" : ""} сформируй детальную рекомендацию по кандидату на вакансию.

ВАКАНСИЯ: ${vacancy.title}
${vacancyDescription}
${vacancyRequirements}

КАНДИДАТ: ${candidateName}

Опыт работы:
${candidateExperience}

${candidateSkills}
${candidateCoverLetter}
${candidateSalary}

РЕЗУЛЬТАТЫ СКРИНИНГА:
- Общая оценка: ${screening.score}/5
- Детальная оценка: ${screening.detailedScore}/100
${screeningMatchPercentage}
- Анализ: ${screening.analysis}
${screeningStrengths}
${screeningWeaknesses}
${interviewSection}

ЗАДАЧА:
Сформируй рекомендацию по кандидату на вакансию${interview ? ", учитывая результаты интервью" : ""}.

КРИТЕРИИ ОЦЕНКИ:
${
  interview
    ? `
- HIGHLY_RECOMMENDED: interviewScore >= 80 И detailedScore >= 70, отличное соответствие и успешное интервью
- RECOMMENDED: interviewScore >= 60 И detailedScore >= 50, хорошее соответствие
- NEUTRAL: interviewScore >= 40 ИЛИ detailedScore >= 40, требуется дополнительная оценка
- NOT_RECOMMENDED: interviewScore < 40 ИЛИ detailedScore < 40 ИЛИ botUsageDetected === true

⚠️ ВАЖНО: Если обнаружено использование ботов (botUsageDetected === true), рекомендация ДОЛЖНА быть NOT_RECOMMENDED независимо от других оценок.
`
    : `
- HIGHLY_RECOMMENDED: detailedScore >= 80, отличное соответствие всем ключевым требованиям
- RECOMMENDED: detailedScore >= 60, хорошее соответствие с незначительными пробелами
- NEUTRAL: detailedScore >= 40, среднее соответствие, требуется дополнительная оценка
- NOT_RECOMMENDED: detailedScore < 40, критические несоответствия

⚠️ ВНИМАНИЕ: Интервью не проводилось. Рекомендация основана только на скрининге резюме.
`
}

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
- strengths: 1-5 пунктов, конкретные преимущества кандидата${interview ? " (учитывай результаты интервью)" : ""}
- weaknesses: 0-5 пунктов, конкретные недостатки или пробелы${interview ? " (включая проблемы, выявленные на интервью)" : ""}
- candidateSummary: краткое, информативное резюме для быстрого принятия решения
- actionSuggestions: 1-3 конкретных действия (${interview ? "принять решение о найме, провести финальное интервью, отклонить" : "пригласить на интервью, запросить портфолио, отклонить"})
- interviewQuestions: ${interview ? "0-3 вопроса для финального интервью (если требуется)" : "0-3 вопроса для первого интервью"}
- riskFactors: 0-3 потенциальных риска при найме${interview?.botUsageDetected ? " (ОБЯЗАТЕЛЬНО укажи использование ботов как критический риск)" : ""}`;
  }
}
