import type { VacancyResponse } from "./types";

export function calculateMatchScore(response: VacancyResponse): number {
  // Используем реальную оценку навыков из AI-скрининга
  if (
    response.screening?.skillsMatchScore !== null &&
    response.screening?.skillsMatchScore !== undefined
  ) {
    return response.screening.skillsMatchScore;
  }

  // Fallback: если скрининга нет, используем общую оценку
  if (
    response.screening?.score !== null &&
    response.screening?.score !== undefined
  ) {
    return response.screening.score;
  }

  // Fallback: если вообще нет скрининга, возвращаем 0
  return 0;
}

export function calculateResponseTime(response: VacancyResponse): string {
  // Время с момента отклика до сейчас
  const now = new Date();
  const respondedAt = response.respondedAt || response.createdAt;
  const diffMs = now.getTime() - new Date(respondedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "< 1ч";
  if (diffHours < 24) return `${diffHours}ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 день назад";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} нед. назад`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} мес. назад`;
}

export function calculateLastActivity(response: VacancyResponse): string {
  // Последняя активность - используем updatedAt если есть, иначе respondedAt
  const lastActivityDate =
    response.updatedAt || response.respondedAt || response.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(lastActivityDate).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return "Только что";
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
  if (diffHours < 24) return `${diffHours}ч назад`;
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return ">7 дн. назад";
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
