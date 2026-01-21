/**
 * Промпты для генерации рекомендаций по кандидатам
 */

import { z } from "zod";

/**
 * Уровни рекомендаций (соответствуют enum в БД)
 */
export const RecommendationLevel = {
  HIGHLY_RECOMMENDED: "HIGHLY_RECOMMENDED",
  RECOMMENDED: "RECOMMENDED",
  NEUTRAL: "NEUTRAL",
  NOT_RECOMMENDED: "NOT_RECOMMENDED",
} as const;

export type RecommendationLevel =
  (typeof RecommendationLevel)[keyof typeof RecommendationLevel];

/**
 * Zod схема для результата рекомендации
 */
export const CandidateRecommendationSchema = z.object({
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

export type CandidateRecommendation = z.infer<
  typeof CandidateRecommendationSchema
>;

/**
 * Zod схема для валидации данных скрининга
 * Ограничения:
 * - analysis: макс 2000 символов
 * - strengths/weaknesses: макс 10 элементов, каждый макс 200 символов
 * - summary: макс 500 символов
 */
export const ScreeningDataForRecommendationSchema = z.object({
  score: z.number().min(0).max(5),
  detailedScore: z.number().min(0).max(100),
  analysis: z.string().max(2000),
  matchPercentage: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string().max(200)).max(10).optional(),
  weaknesses: z.array(z.string().max(200)).max(10).optional(),
  summary: z.string().max(500).optional(),
});

/**
 * Zod схема для валидации данных кандидата
 * Ограничения:
 * - name: макс 300 символов
 * - experience: макс 1000 символов
 * - skills: макс 50 элементов, каждый макс 100 символов
 * - coverLetter: макс 2000 символов
 * - числовые поля: положительные числа
 */
export const CandidateDataForRecommendationSchema = z.object({
  name: z.string().max(300).nullable(),
  experience: z.string().max(1000).nullable(),
  skills: z.array(z.string().max(100)).max(50).nullable().optional(),
  coverLetter: z.string().max(2000).nullable().optional(),
  salaryExpectations: z.number().positive().nullable().optional(),
  proposedPrice: z.number().positive().nullable().optional(),
  proposedDeliveryDays: z.number().positive().int().nullable().optional(),
});

/**
 * Zod схема для валидации данных сущности (вакансия/gig)
 * Ограничения:
 * - title: макс 300 символов
 * - description: макс 1000 символов
 * - requirements: макс 20 элементов, каждый макс 200 символов
 * - числовые поля: положительные числа
 */
export const EntityDataForRecommendationSchema = z.object({
  type: z.enum(["vacancy", "gig"]),
  title: z.string().max(300),
  description: z.string().max(1000).optional(),
  requirements: z.array(z.string().max(200)).max(20).optional(),
  budget: z
    .object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    })
    .nullable()
    .optional(),
  deliveryDays: z.number().positive().int().nullable().optional(),
});

/**
 * Входные данные скрининга для генерации рекомендации
 */
export interface ScreeningDataForRecommendation {
  score: number;
  detailedScore: number;
  analysis: string;
  matchPercentage?: number;
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
}

/**
 * Данные кандидата для рекомендации
 */
export interface CandidateDataForRecommendation {
  name: string | null;
  experience: string | null;
  skills?: string[] | null;
  coverLetter?: string | null;
  salaryExpectations?: number | null;
  proposedPrice?: number | null;
  proposedDeliveryDays?: number | null;
}

/**
 * Данные сущности (вакансия или gig)
 */
export interface EntityDataForRecommendation {
  type: "vacancy" | "gig";
  title: string;
  description?: string;
  requirements?: string[];
  budget?: { min?: number; max?: number } | null;
  deliveryDays?: number | null;
}

/**
 * Функция для санитизации и обрезки строк до максимальной длины
 */
function truncateString(
  str: string | null | undefined,
  maxLength: number,
): string | null {
  if (!str) return str ?? null;
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/**
 * Функция для санитизации массива строк
 */
function truncateStringArray(
  arr: string[] | null | undefined,
  maxItems: number,
  maxItemLength: number,
): string[] | undefined {
  if (!arr) return undefined;
  return arr
    .slice(0, maxItems)
    .map((item) => truncateString(item, maxItemLength) ?? "")
    .filter((item) => item.length > 0);
}

/**
 * Санитизация данных скрининга с обрезкой до допустимых лимитов
 */
function sanitizeScreeningData(
  screening: ScreeningDataForRecommendation,
): ScreeningDataForRecommendation {
  return {
    score: Math.max(0, Math.min(5, screening.score)),
    detailedScore: Math.max(0, Math.min(100, screening.detailedScore)),
    analysis: truncateString(screening.analysis, 2000) ?? "",
    matchPercentage: screening.matchPercentage
      ? Math.max(0, Math.min(100, screening.matchPercentage))
      : undefined,
    strengths: truncateStringArray(screening.strengths, 10, 200),
    weaknesses: truncateStringArray(screening.weaknesses, 10, 200),
    summary: truncateString(screening.summary, 500) ?? undefined,
  };
}

/**
 * Санитизация данных кандидата с обрезкой до допустимых лимитов
 */
function sanitizeCandidateData(
  candidate: CandidateDataForRecommendation,
): CandidateDataForRecommendation {
  return {
    name: truncateString(candidate.name, 300),
    experience: truncateString(candidate.experience, 1000),
    skills: truncateStringArray(candidate.skills ?? undefined, 50, 100),
    coverLetter: truncateString(candidate.coverLetter, 2000) ?? undefined,
    salaryExpectations:
      candidate.salaryExpectations && candidate.salaryExpectations > 0
        ? candidate.salaryExpectations
        : null,
    proposedPrice:
      candidate.proposedPrice && candidate.proposedPrice > 0
        ? candidate.proposedPrice
        : null,
    proposedDeliveryDays:
      candidate.proposedDeliveryDays && candidate.proposedDeliveryDays > 0
        ? Math.floor(candidate.proposedDeliveryDays)
        : null,
  };
}

/**
 * Санитизация данных сущности с обрезкой до допустимых лимитов
 */
function sanitizeEntityData(
  entity: EntityDataForRecommendation,
): EntityDataForRecommendation {
  return {
    type: entity.type,
    title: truncateString(entity.title, 300) ?? "",
    description: truncateString(entity.description, 1000) ?? undefined,
    requirements: truncateStringArray(entity.requirements, 20, 200),
    budget: entity.budget
      ? {
          min:
            entity.budget.min && entity.budget.min > 0
              ? entity.budget.min
              : undefined,
          max:
            entity.budget.max && entity.budget.max > 0
              ? entity.budget.max
              : undefined,
        }
      : null,
    deliveryDays:
      entity.deliveryDays && entity.deliveryDays > 0
        ? Math.floor(entity.deliveryDays)
        : null,
  };
}

/**
 * Построение промпта для генерации рекомендации по кандидату
 *
 * ВАЛИДАЦИЯ И САНИТИЗАЦИЯ:
 * Функция валидирует входные данные против схем:
 * - ScreeningDataForRecommendationSchema
 * - CandidateDataForRecommendationSchema
 * - EntityDataForRecommendationSchema
 *
 * При обнаружении невалидных данных применяется санитизация:
 * - Строки обрезаются до максимальной длины
 * - Массивы ограничиваются по количеству элементов
 * - Числовые значения приводятся к допустимым диапазонам
 *
 * Это гарантирует, что размер промпта остается в разумных пределах.
 */
export function buildCandidateRecommendationPrompt(
  screening: ScreeningDataForRecommendation,
  candidate: CandidateDataForRecommendation,
  entity: EntityDataForRecommendation,
): string {
  // Валидация и санитизация входных данных
  let validatedScreening: ScreeningDataForRecommendation;
  let validatedCandidate: CandidateDataForRecommendation;
  let validatedEntity: EntityDataForRecommendation;

  try {
    validatedScreening = ScreeningDataForRecommendationSchema.parse(screening);
  } catch (error) {
    // Если валидация не прошла, применяем санитизацию
    console.warn(
      "Screening data validation failed, applying sanitization:",
      error,
    );
    validatedScreening = sanitizeScreeningData(screening);

    // Повторная валидация после санитизации
    try {
      validatedScreening =
        ScreeningDataForRecommendationSchema.parse(validatedScreening);
    } catch (sanitizationError) {
      throw new Error(
        `Failed to sanitize screening data: ${sanitizationError instanceof Error ? sanitizationError.message : "Unknown error"}`,
      );
    }
  }

  try {
    validatedCandidate = CandidateDataForRecommendationSchema.parse(candidate);
  } catch (error) {
    console.warn(
      "Candidate data validation failed, applying sanitization:",
      error,
    );
    validatedCandidate = sanitizeCandidateData(candidate);

    try {
      validatedCandidate =
        CandidateDataForRecommendationSchema.parse(validatedCandidate);
    } catch (sanitizationError) {
      throw new Error(
        `Failed to sanitize candidate data: ${sanitizationError instanceof Error ? sanitizationError.message : "Unknown error"}`,
      );
    }
  }

  try {
    validatedEntity = EntityDataForRecommendationSchema.parse(entity);
  } catch (error) {
    console.warn(
      "Entity data validation failed, applying sanitization:",
      error,
    );
    validatedEntity = sanitizeEntityData(entity);

    try {
      validatedEntity =
        EntityDataForRecommendationSchema.parse(validatedEntity);
    } catch (sanitizationError) {
      throw new Error(
        `Failed to sanitize entity data: ${sanitizationError instanceof Error ? sanitizationError.message : "Unknown error"}`,
      );
    }
  }

  // Используем валидированные данные для построения промпта
  const entityTypeRu =
    validatedEntity.type === "vacancy" ? "вакансию" : "задание";
  const entityTitleRu =
    validatedEntity.type === "vacancy" ? "Вакансия" : "Задание";

  const budgetInfo =
    validatedEntity.budget?.min || validatedEntity.budget?.max
      ? `Бюджет: ${validatedEntity.budget.min || "не указан"} - ${validatedEntity.budget.max || "не указан"}`
      : "";

  const candidatePriceInfo =
    validatedEntity.type === "gig" && validatedCandidate.proposedPrice
      ? `Предложенная цена: ${validatedCandidate.proposedPrice}`
      : validatedCandidate.salaryExpectations
        ? `Зарплатные ожидания: ${validatedCandidate.salaryExpectations}`
        : "";

  const deliveryInfo =
    validatedEntity.type === "gig"
      ? `
Срок выполнения (требуемый): ${validatedEntity.deliveryDays || "не указан"} дней
Срок выполнения (предложенный): ${validatedCandidate.proposedDeliveryDays || "не указан"} дней`
      : "";

  return `Ты — эксперт HR-аналитик. На основе результатов скрининга сформируй детальную рекомендацию по кандидату.

${entityTitleRu.toUpperCase()}: ${validatedEntity.title}
${validatedEntity.description ? `Описание: ${validatedEntity.description}` : ""}
${validatedEntity.requirements?.length ? `Требования:\n${validatedEntity.requirements.map((r) => `- ${r}`).join("\n")}` : ""}
${budgetInfo}
${deliveryInfo}

КАНДИДАТ: ${validatedCandidate.name || "Имя не указано"}

Опыт работы:
${validatedCandidate.experience || "Не указан"}

${validatedCandidate.skills?.length ? `Навыки: ${validatedCandidate.skills.join(", ")}` : ""}
${validatedCandidate.coverLetter ? `Сопроводительное письмо: ${validatedCandidate.coverLetter}` : ""}
${candidatePriceInfo}

РЕЗУЛЬТАТЫ СКРИНИНГА:
- Общая оценка: ${validatedScreening.score}/5
- Детальная оценка: ${validatedScreening.detailedScore}/100
${validatedScreening.matchPercentage ? `- Процент соответствия: ${validatedScreening.matchPercentage}%` : ""}
- Анализ: ${validatedScreening.analysis}
${validatedScreening.strengths?.length ? `- Сильные стороны: ${validatedScreening.strengths.join(", ")}` : ""}
${validatedScreening.weaknesses?.length ? `- Слабые стороны: ${validatedScreening.weaknesses.join(", ")}` : ""}

ЗАДАЧА:
Сформируй рекомендацию по кандидату на ${entityTypeRu}.

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
 * Форматирование рекомендации для отображения в Telegram
 */
export function formatRecommendationForTelegram(
  recommendation: CandidateRecommendation,
  candidateName: string | null,
  entityTitle: string,
): string {
  const levelEmoji = {
    HIGHLY_RECOMMENDED: "🌟",
    RECOMMENDED: "✅",
    NEUTRAL: "⚖️",
    NOT_RECOMMENDED: "❌",
  };

  const levelText = {
    HIGHLY_RECOMMENDED: "Настоятельно рекомендуется",
    RECOMMENDED: "Рекомендуется",
    NEUTRAL: "Нейтрально",
    NOT_RECOMMENDED: "Не рекомендуется",
  };

  const emoji = levelEmoji[recommendation.recommendation];
  const text = levelText[recommendation.recommendation];

  let message = `${emoji} <b>Рекомендация по кандидату</b>\n\n`;
  message += `👤 <b>Кандидат:</b> ${candidateName || "Не указано"}\n`;
  message += `📋 <b>Позиция:</b> ${entityTitle}\n\n`;
  message += `<b>Вердикт:</b> ${text}\n\n`;
  message += `<b>Резюме:</b>\n${recommendation.candidateSummary}\n\n`;

  if (recommendation.strengths.length > 0) {
    message += `<b>✅ Сильные стороны:</b>\n`;
    message += recommendation.strengths.map((s) => `• ${s}`).join("\n");
    message += "\n\n";
  }

  if (recommendation.weaknesses.length > 0) {
    message += `<b>⚠️ Слабые стороны:</b>\n`;
    message += recommendation.weaknesses.map((w) => `• ${w}`).join("\n");
    message += "\n\n";
  }

  if (recommendation.riskFactors.length > 0) {
    message += `<b>🚨 Риски:</b>\n`;
    message += recommendation.riskFactors.map((r) => `• ${r}`).join("\n");
    message += "\n\n";
  }

  if (recommendation.interviewQuestions.length > 0) {
    message += `<b>❓ Вопросы для интервью:</b>\n`;
    message += recommendation.interviewQuestions
      .map((q) => `• ${q}`)
      .join("\n");
    message += "\n\n";
  }

  message += `<b>📌 Рекомендуемые действия:</b>\n`;
  message += recommendation.actionSuggestions.map((a) => `• ${a}`).join("\n");

  return message;
}
