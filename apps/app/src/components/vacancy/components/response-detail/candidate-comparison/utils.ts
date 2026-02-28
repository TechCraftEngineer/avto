import { getStatusLabel } from "~/lib/shared/response-configs";
import type { VacancyResponse, VacancyResponseFromList } from "../types";

/**
 * Расчет соответствия кандидата требованиям вакансии
 */
export function calculateMatchScore(
  response: VacancyResponse | VacancyResponseFromList,
): number {
  let score = 0;
  if (response.profileData && !response.profileData.error) score += 30;
  if ("resumePdfUrl" in response && response.resumePdfUrl) score += 20;
  if (response.salaryExpectationsAmount) score += 15;
  if (response.email || response.phone || response.telegramUsername)
    score += 15;
  if (response.skills?.length) score += 10;
  if (response.coverLetter) score += 10;
  return Math.min(score, 100);
}

/**
 * Расчет времени отклика
 */
export function calculateResponseTime(
  response: VacancyResponse | VacancyResponseFromList,
): string {
  const now = new Date();
  const respondedAt = response.respondedAt || response.createdAt;
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}ч`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}д`;
}

/**
 * Расчет последней активности
 */
export function calculateLastActivity(
  response: VacancyResponse | VacancyResponseFromList,
): string {
  const respondedAt = response.respondedAt || response.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} д.`;
  return ">7 д.";
}

/**
 * Получение опыта из профиля
 */
export function getExperienceFromProfile(
  response: VacancyResponse | VacancyResponseFromList,
): string {
  if (response.profileData && !response.profileData.error) {
    const profile = response.profileData;
    if (profile.experience) {
      if (Array.isArray(profile.experience) && profile.experience.length > 0) {
        return `${profile.experience.length} позиций`;
      }
      return "Есть опыт";
    }
  }
  return "Не указано";
}

export { getStatusLabel };

/**
 * Цвет для статуса
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800";
    case "EVALUATED":
      return "bg-yellow-100 text-yellow-800";
    case "INTERVIEW":
      return "bg-purple-100 text-purple-800";
    case "NEGOTIATION":
      return "bg-orange-100 text-orange-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "SKIPPED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Цвет для оценки соответствия
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 font-bold";
  if (score >= 70) return "text-blue-600 font-semibold";
  if (score >= 50) return "text-yellow-600 font-medium";
  return "text-red-600 font-medium";
}
