/**
 * Определяет тип страницы HH employer
 */

export type HHEmployerPageType =
  | "active-vacancies"
  | "archived-vacancies"
  | "vacancy-responses"
  | "unknown";

export function detectHHEmployerPageType(): HHEmployerPageType {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const vacancyId = params.get("vacancyId");

  if (path.includes("/employer/vacancyresponses") && vacancyId) {
    return "vacancy-responses";
  }
  if (path.includes("/employer/vacancies/archived")) {
    return "archived-vacancies";
  }
  if (path === "/employer/vacancies" || path.includes("/employer/vacancies?")) {
    return "active-vacancies";
  }

  return "unknown";
}

export function getVacancyIdFromResponsesPage(): string | null {
  return new URLSearchParams(window.location.search).get("vacancyId");
}
