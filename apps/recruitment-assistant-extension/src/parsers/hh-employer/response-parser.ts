/**
 * Парсер откликов на вакансии HH.ru
 * Использует те же селекторы, что и Inngest-задание (jobs-parsers)
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

const CONTAINER_SELECTOR = 'div[data-qa="vacancy-real-responses"]';
const ITEM_SELECTOR = `${CONTAINER_SELECTOR} [data-resume-hash]`;
const LINK_SELECTOR = 'a[data-qa="serp-item__title"]';
const NAME_SELECTOR = 'span[data-qa="resume-serp__resume-fullname"]';

/**
 * Извлекает дату отклика из элемента (логика как в Inngest)
 */
function parseRespondedAtFromElement(element: Element): string | undefined {
  const spans = element.querySelectorAll("span");
  for (const span of Array.from(spans)) {
    const text = span.textContent?.trim() || "";
    if (text.includes("Откликнулся")) {
      const innerSpan = span.querySelector("span");
      return innerSpan?.textContent?.trim() ?? undefined;
    }
  }
  return undefined;
}

/**
 * Парсит отклики с текущей страницы
 */
export function parseResponsesFromDOM(
  vacancyExternalId: string,
): ParsedResponse[] {
  const elements = document.querySelectorAll(ITEM_SELECTOR);
  const responses: ParsedResponse[] = [];

  elements.forEach((element, index) => {
    const link = element.querySelector(LINK_SELECTOR) as HTMLAnchorElement;
    const resumeUrl = link?.href
      ? new URL(link.href, "https://hh.ru").href
      : "";
    const resumeIdMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const resumeId = resumeIdMatch?.[1] || "";

    const nameEl = element.querySelector(NAME_SELECTOR);
    const name = nameEl?.textContent?.trim() || "";

    const respondedAt = parseRespondedAtFromElement(element);

    responses.push({
      name,
      resumeUrl,
      resumeId,
      respondedAt,
      externalId: `${vacancyExternalId}_${resumeId}_${index}`,
    });
  });

  return responses;
}

export function getNextPageButton(): Element | null {
  return document.querySelector('[data-qa="pager-next"]');
}

export function hasResponsesList(): boolean {
  return document.querySelector(CONTAINER_SELECTOR) !== null;
}
