/**
 * Вспомогательные функции для синхронизации архивных откликов
 */

import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";
import type { NormalizedResponseData, ResponseEvaluation } from "./types";

/**
 * Нормализует данные отклика из внешнего источника
 */
export function normalizeResponseData(
  rawData: Record<string, unknown>,
): NormalizedResponseData {
  const normalized: NormalizedResponseData = {};

  // Нормализация имени кандидата
  if (rawData.candidateName || rawData.name) {
    normalized.candidateName = String(
      rawData.candidateName || rawData.name,
    ).trim();
  }

  // Нормализация контактов
  if (rawData.email) {
    normalized.email = String(rawData.email).toLowerCase().trim();
  }

  if (rawData.phone) {
    normalized.phone = String(rawData.phone).replace(/[^\d+]/g, "");
  }

  if (rawData.telegramUsername) {
    normalized.telegramUsername = String(rawData.telegramUsername)
      .replace(/^@/, "")
      .trim();
  }

  // Нормализация навыков
  if (Array.isArray(rawData.skills)) {
    normalized.skills = rawData.skills
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);
  }

  // Нормализация опыта
  if (rawData.experience) {
    normalized.experience = rawData.experience;
  }

  // Нормализация URL
  if (rawData.profileUrl) {
    normalized.profileUrl = String(rawData.profileUrl).trim();
  }

  if (rawData.resumeUrl) {
    normalized.resumeUrl = String(rawData.resumeUrl).trim();
  }

  // Нормализация зарплатных ожиданий
  if (rawData.salaryExpectations) {
    const salary = Number(rawData.salaryExpectations);
    if (!Number.isNaN(salary)) {
      normalized.salaryExpectationsAmount = salary;
    }
  }

  return normalized;
}

/**
 * Оценивает отклик и присваивает статус и приоритет
 */
export async function evaluateResponse(
  _responseId: string,
  normalizedData: NormalizedResponseData,
): Promise<ResponseEvaluation> {
  // Базовая логика оценки на основе данных кандидата
  let score = 50; // Базовый балл
  let recommendation = "NEUTRAL";

  // Проверка наличия контактов
  if (
    normalizedData.email ||
    normalizedData.phone ||
    normalizedData.telegramUsername
  ) {
    score += 10;
  }

  // Проверка наличия навыков
  if (
    Array.isArray(normalizedData.skills) &&
    normalizedData.skills.length > 0
  ) {
    score += normalizedData.skills.length * 2;
  }

  // Проверка зарплатных ожиданий
  if (normalizedData.salaryExpectationsAmount) {
    const salary = Number(normalizedData.salaryExpectationsAmount);
    if (salary > 0 && salary < 300000) {
      score += 10;
    }
  }

  // Определение рекомендации на основе балла
  if (score >= 80) {
    recommendation = "HIGHLY_RECOMMENDED";
  } else if (score >= 60) {
    recommendation = "RECOMMENDED";
  } else if (score < 40) {
    recommendation = "NOT_RECOMMENDED";
  }

  // Определение статуса HR
  let hrStatus: HrSelectionStatus = "INVITE";
  if (recommendation === "HIGHLY_RECOMMENDED") {
    hrStatus = "RECOMMENDED";
  } else if (recommendation === "NOT_RECOMMENDED") {
    hrStatus = "NOT_RECOMMENDED";
  }

  // Определение статуса отклика
  let status: ResponseStatus = "NEW";
  if (score >= 50) {
    status = "EVALUATED";
  }

  // Вычисление приоритета (0-100)
  const priority = Math.min(100, Math.max(0, score));

  return { status, hrStatus, priority, recommendation };
}
