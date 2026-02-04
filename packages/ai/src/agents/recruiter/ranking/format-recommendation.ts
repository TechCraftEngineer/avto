/**
 * Утилиты для форматирования рекомендаций для отображения
 */

import type { GigRecommendationOutput } from "./gig-recommendation-agent";
import type { VacancyRecommendationOutput } from "./vacancy-recommendation-agent";

/**
 * Форматирование рекомендации по вакансии для Telegram
 */
export function formatVacancyRecommendationForTelegram(
  recommendation: VacancyRecommendationOutput,
  candidateName: string | null,
  vacancyTitle: string,
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
  message += `📋 <b>Вакансия:</b> ${vacancyTitle}\n\n`;
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

/**
 * Форматирование рекомендации по заданию для Telegram
 */
export function formatGigRecommendationForTelegram(
  recommendation: GigRecommendationOutput,
  candidateName: string | null,
  gigTitle: string,
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

  let message = `${emoji} <b>Рекомендация по исполнителю</b>\n\n`;
  message += `👤 <b>Исполнитель:</b> ${candidateName || "Не указано"}\n`;
  message += `📋 <b>Задание:</b> ${gigTitle}\n\n`;
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

  if (recommendation.budgetAssessment) {
    const budgetEmoji = recommendation.budgetAssessment.isReasonable
      ? "💰"
      : "⚠️";
    const budgetText = recommendation.budgetAssessment.isReasonable
      ? "Адекватная"
      : "Требует обсуждения";
    message += `<b>${budgetEmoji} Оценка бюджета:</b> ${budgetText}\n`;
    if (recommendation.budgetAssessment.comment) {
      message += `${recommendation.budgetAssessment.comment}\n`;
    }
    message += "\n";
  }

  if (recommendation.deliveryAssessment) {
    const deliveryEmoji = recommendation.deliveryAssessment.isRealistic
      ? "⏱️"
      : "⚠️";
    const deliveryText = recommendation.deliveryAssessment.isRealistic
      ? "Реалистичные"
      : "Требуют обсуждения";
    message += `<b>${deliveryEmoji} Оценка сроков:</b> ${deliveryText}\n`;
    if (recommendation.deliveryAssessment.comment) {
      message += `${recommendation.deliveryAssessment.comment}\n`;
    }
    message += "\n";
  }

  if (recommendation.riskFactors.length > 0) {
    message += `<b>🚨 Риски:</b>\n`;
    message += recommendation.riskFactors.map((r) => `• ${r}`).join("\n");
    message += "\n\n";
  }

  if (recommendation.interviewQuestions.length > 0) {
    message += `<b>❓ Вопросы для обсуждения:</b>\n`;
    message += recommendation.interviewQuestions
      .map((q) => `• ${q}`)
      .join("\n");
    message += "\n\n";
  }

  message += `<b>📌 Рекомендуемые действия:</b>\n`;
  message += recommendation.actionSuggestions.map((a) => `• ${a}`).join("\n");

  return message;
}
