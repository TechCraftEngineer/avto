/**
 * Сбор вакансий и откликов с пагинацией
 */

import {
  fetchCoverLetterForOne,
  getNextPageButton,
  type ParsedResponse,
  type ParsedVacancy,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  parseResponsesFromDOM,
} from "../../parsers/hh-employer";
import { ACTIVE_CHECKBOX_SELECTOR } from "./checkboxes";

/**
 * Собирает все вакансии (с пагинацией)
 */
export async function collectAllVacancies(
  isActive: boolean,
  onProgress?: (current: number, total: number) => void,
): Promise<ParsedVacancy[]> {
  const all: ParsedVacancy[] = [];
  let pageNum = 0;

  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  while (true) {
    const pageItems = parseFn();
    const seen = new Set(all.map((v) => v.externalId));
    for (const v of pageItems) {
      if (!seen.has(v.externalId)) {
        seen.add(v.externalId);
        all.push(v);
      }
    }

    onProgress?.(all.length, all.length + (pageItems.length > 0 ? 50 : 0));

    const nextBtn = getNextPageButton();
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

/** Прогресс сбора откликов: собрано и опционально прогресс по письмам на текущей странице */
export type ResponsesCollectProgress = {
  collected: number;
  estimatedTotal: number;
  coverLetters?: { done: number; total: number };
};

/**
 * Собирает все отклики (с пагинацией).
 * Если передан fetchCoverLetters, после каждой страницы вызывает его для сбора сопроводительных писем.
 */
export async function collectAllResponses(
  vacancyExternalId: string,
  onProgress?: (info: ResponsesCollectProgress) => void,
  fetchCoverLetters?: (
    pageResponses: ParsedResponse[],
    onLetterProgress?: (done: number, total: number) => void,
  ) => Promise<void>,
): Promise<ParsedResponse[]> {
  const all: ParsedResponse[] = [];
  let pageNum = 0;

  while (true) {
    const pageItems = parseResponsesFromDOM(vacancyExternalId);
    const seen = new Set(all.map((r) => r.externalId));
    for (const r of pageItems) {
      if (!seen.has(r.externalId)) {
        seen.add(r.externalId);
        all.push(r);
      }
    }

    // Прогресс сразу после парсинга страницы — пользователь видит результат без ожидания писем
    onProgress?.({
      collected: all.length,
      estimatedTotal: all.length + (pageItems.length > 0 ? 20 : 0),
    });

    if (pageItems.length > 0 && fetchCoverLetters) {
      await fetchCoverLetters(pageItems, (lettersDone, lettersTotal) => {
        onProgress?.({
          collected: all.length,
          estimatedTotal: all.length + 20,
          coverLetters: { done: lettersDone, total: lettersTotal },
        });
      });
    }

    const nextBtn = document.querySelector('[data-qa="pager-next"]');
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

const RESPONSE_PAGER_NEXT_SELECTOR = '[data-qa="pager-next"]';
const COVER_LETTER_BUTTON_SELECTOR = 'button[data-qa="show-resume-messages"]';

/** Опции потокового сбора откликов */
export type CollectResponsesStreamingOptions = {
  /** Максимум откликов для обработки (по умолчанию 100) */
  maxResponses?: number;
};

/**
 * Потоковый сбор откликов: для каждого отклика сразу вызывается processResponse.
 * Страница → отклик 1 (письмо → process) → отклик 2 → ... → следующая страница.
 * Пользователь видит прогресс с первого отклика без долгой фазы "Сбор откликов".
 */
export async function collectResponsesStreaming(
  vacancyExternalId: string,
  processResponse: (response: ParsedResponse, index: number) => Promise<void>,
  onProgress?: (processed: number, estimatedTotal: number) => void,
  options?: CollectResponsesStreamingOptions,
): Promise<number> {
  const maxResponses = options?.maxResponses ?? 100;
  let processed = 0;

  for (let pageNum = 0; pageNum < 100; pageNum++) {
    const pageItems = parseResponsesFromDOM(vacancyExternalId);
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      COVER_LETTER_BUTTON_SELECTOR,
    );

    for (let i = 0; i < pageItems.length; i++) {
      if (processed >= maxResponses) return processed;

      const r = pageItems[i];
      if (!r) continue;

      try {
        if (r.coverLetter === undefined) {
          const btn = buttons[i];
          if (btn) {
            await fetchCoverLetterForOne(r, btn);
          }
        }

        await processResponse(r, processed);
        processed++;

        onProgress?.(processed, processed + (pageItems.length > 0 ? 20 : 0));
      } catch (e) {
        console.error(`[Import] Ошибка обработки отклика ${r.name}:`, e);
        throw e;
      }
    }

    const nextBtn = document.querySelector(RESPONSE_PAGER_NEXT_SELECTOR);
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  return processed;
}

/**
 * Собирает только выбранные вакансии из DOM (без пагинации).
 * Берет только те вакансии, у которых отмечен чекбокс на текущей странице.
 */
export function collectSelectedVacanciesFromCurrentPage(
  isActive: boolean,
): ParsedVacancy[] {
  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  const allVacancies = parseFn();
  const selected: ParsedVacancy[] = [];

  if (isActive) {
    const checkedIds = new Set<string>();
    // Сначала проверяем нативные чекбоксы HH
    const nativeChecked = document.querySelectorAll<HTMLInputElement>(
      `${ACTIVE_CHECKBOX_SELECTOR}:checked`,
    );
    if (nativeChecked.length > 0) {
      nativeChecked.forEach((cb) => {
        const val = cb.value?.trim();
        if (val && val !== "on") checkedIds.add(val);
      });
    } else {
      // Fallback: инжектированные чекбоксы (страница vacancy-serp)
      const CHECKBOX_CLASS = "recruitment-assistant-vacancy-checkbox";
      const injectedChecked = document.querySelectorAll<HTMLInputElement>(
        `input.${CHECKBOX_CLASS}:checked`,
      );
      injectedChecked.forEach((cb) => {
        const id = cb.dataset.externalId;
        if (id) checkedIds.add(id);
      });
    }

    for (const v of allVacancies) {
      if (checkedIds.has(v.externalId)) {
        selected.push(v);
      }
    }
  } else {
    // Для архивных - проверяем нативные чекбоксы HH
    const ARCHIVE_CHECKBOX_SELECTOR =
      '[data-qa^="vacancies-dashboard-vacancy-archive-label"] input[type="checkbox"]';
    const checkedBoxes = document.querySelectorAll<HTMLInputElement>(
      ARCHIVE_CHECKBOX_SELECTOR,
    );
    const checkedIds = new Set<string>();

    checkedBoxes.forEach((cb) => {
      if (!cb.checked) return;
      // Извлекаем ID из value или из родительской строки
      const val = cb.value?.trim();
      if (val && val !== "on") {
        checkedIds.add(val);
      } else {
        const row = cb.closest('div[data-qa^="vacancy-archive_"]');
        const dataQa = row?.getAttribute("data-qa") || "";
        const match = dataQa.match(/vacancy-archive_(\d+)/);
        if (match?.[1]) checkedIds.add(match[1]);
      }
    });

    for (const v of allVacancies) {
      if (checkedIds.has(v.externalId)) {
        selected.push(v);
      }
    }
  }

  return selected;
}

/**
 * Собирает только выбранные вакансии (с пагинацией).
 * Проходит страницы начиная с текущей. Для импорта выбранных с предыдущих
 * страниц перейдите на первую страницу списка.
 * @deprecated Используйте collectSelectedVacanciesFromCurrentPage вместо этого
 */
export async function collectSelectedVacancies(
  selectedIds: Set<string>,
  isActive: boolean,
  onProgress?: (current: number, total: number) => void,
): Promise<ParsedVacancy[]> {
  const all: ParsedVacancy[] = [];
  const parseFn = isActive
    ? parseActiveVacanciesFromDOM
    : parseArchivedVacanciesFromDOM;

  for (let pageNum = 0; pageNum < 100; pageNum++) {
    const pageItems = parseFn();
    for (const v of pageItems) {
      if (selectedIds.has(v.externalId)) {
        const seen = new Set(all.map((x) => x.externalId));
        if (!seen.has(v.externalId)) all.push(v);
      }
    }
    onProgress?.(all.length, selectedIds.size);

    const nextBtn = getNextPageButton();
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  return all;
}
