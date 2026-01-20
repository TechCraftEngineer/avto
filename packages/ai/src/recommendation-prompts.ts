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
  interviewQuestions: z.array(z.string()).max(3).optional(),
  riskFactors: z.array(z.string()).max(3).optional(),
});

export type CandidateRecommendation = z.infer<
  typeof CandidateRecommendationSchema
>;

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
 * Построение промпта для генерации рекомендации по кандидату
 */
export function buildCandidateRecommendationPrompt(
  screening: ScreeningDataForRecommendation,
  candidate: CandidateDataForRecommendation,
  entity: EntityDataForRecommendation,
): string {
  const entityTypeRu = entity.type === "vacancy" ? "вакансию" : "задание";
  const entityTitleRu = entity.type === "vacancy" ? "Вакансия" : "Задание";

  const budgetInfo =
    entity.budget?.min || entity.budget?.max
      ? `Бюджет: ${entity.budget.min || "не указан"} - ${entity.budget.max || "не указан"}`
      : "";

  const candidatePriceInfo =
    entity.type === "gig" && candidate.proposedPrice
      ? `Предложенная цена: ${candidate.proposedPrice}`
      : candidate.salaryExpectations
        ? `Зарплатные ожидания: ${candidate.salaryExpectations}`
        : "";

  const deliveryInfo =
    entity.type === "gig"
      ? `
Срок выполнения (требуемый): ${entity.deliveryDays || "не указан"} дней
Срок выполнения (предложенный): ${candidate.proposedDeliveryDays || "не указан"} дней`
      : "";

  return `Ты — эксперт HR-аналитик. На основе результатов скрининга сформируй детальную рекомендацию по кандидату.

${entityTitleRu.toUpperCase()}: ${entity.title}
${entity.description ? `Описание: ${entity.description}` : ""}
${entity.requirements?.length ? `Требования:\n${entity.requirements.map((r) => `- ${r}`).join("\n")}` : ""}
${budgetInfo}
${deliveryInfo}

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

  if (recommendation.riskFactors && recommendation.riskFactors.length > 0) {
    message += `<b>🚨 Риски:</b>\n`;
    message += recommendation.riskFactors.map((r) => `• ${r}`).join("\n");
    message += "\n\n";
  }

  if (
    recommendation.interviewQuestions &&
    recommendation.interviewQuestions.length > 0
  ) {
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
