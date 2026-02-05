import type { VacancyResponse } from "./types";

export function calculateMatchScore(response: VacancyResponse): number {
  let score = 0;
  if (response.profileData && !response.profileData.error) score += 30;
  if (response.resumeUrl) score += 20;
  if (response.salaryExpectationsAmount) score += 15;
  if (response.email || response.phone || response.telegramUsername)
    score += 15;
  if (response.skills?.length) score += 10;
  if (response.coverLetter) score += 10;
  return Math.min(score, 100);
}

export function calculateResponseTime(response: VacancyResponse): string {
  const now = new Date();
  const respondedAt = response.respondedAt || response.createdAt;
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}ч`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}д`;
}

export function calculateLastActivity(response: VacancyResponse): string {
  const respondedAt = response.respondedAt || response.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} д.`;
  return ">7 д.";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "EVALUATED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INTERVIEW":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "NEGOTIATION":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "SKIPPED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "NEW":
      return "Новый";
    case "EVALUATED":
      return "Оценено";
    case "INTERVIEW":
      return "Собеседование";
    case "NEGOTIATION":
      return "Переговоры";
    case "COMPLETED":
      return "Завершено";
    case "SKIPPED":
      return "Пропущено";
    default:
      return status;
  }
}

export function getImportSourceLabel(importSource: string): string {
  switch (importSource) {
    case "HH":
      return "HeadHunter";
    case "SUPERJOB":
      return "SuperJob";
    case "AVITO":
      return "Авито";
    case "HABR":
      return "Habr";
    case "KWORK":
      return "Kwork";
    case "FL_RU":
      return "FL.ru";
    case "FREELANCE_RU":
      return "Freelance.ru";
    case "WEB_LINK":
      return "Веб-ссылка";
    case "TELEGRAM":
      return "Telegram";
    case "MANUAL":
      return "Вручную";
    default:
      return importSource;
  }
}
