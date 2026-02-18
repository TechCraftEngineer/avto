/**
 * Парсер откликов на вакансии HH.ru
 * Использует те же data-qa селекторы, что и серверный парсер
 */

export interface ParsedResponse {
  name: string;
  resumeUrl: string;
  resumeId: string;
  status?: string;
  respondedAt?: string;
  coverLetter?: string;
  externalId: string;
}

/**
 * Парсит отклики с текущей страницы
 */
export function parseResponsesFromDOM(
  vacancyExternalId: string,
): ParsedResponse[] {
  const elements = document.querySelectorAll(
    '[data-qa="responses-list"] [data-qa*="response"]',
  );
  const responses: ParsedResponse[] = [];

  elements.forEach((element, index) => {
    const nameEl = element.querySelector(
      '[data-qa="response-candidate-name"]',
    );
    const resumeLink = element.querySelector(
      '[data-qa="response-candidate-link"]',
    ) as HTMLAnchorElement;
    const resumeUrl = resumeLink?.href || "";
    const resumeIdMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const resumeId = resumeIdMatch?.[1] || "";

    const statusEl = element.querySelector('[data-qa*="response-status"]');
    const dateEl = element.querySelector('[data-qa="response-date"]');
    const coverLetterEl = element.querySelector(
      '[data-qa="response-cover-letter"]',
    );

    responses.push({
      name: nameEl?.textContent?.trim() || "",
      resumeUrl,
      resumeId,
      status: statusEl?.textContent?.trim(),
      respondedAt: dateEl?.textContent?.trim(),
      coverLetter: coverLetterEl?.textContent?.trim(),
      externalId: `${vacancyExternalId}_${resumeId}_${index}`,
    });
  });

  return responses;
}

export function getNextPageButton(): Element | null {
  return document.querySelector('[data-qa="pager-next"]');
}

export function hasResponsesList(): boolean {
  return document.querySelector('[data-qa="responses-list"]') !== null;
}
