/**
 * Привязка и инъекция чекбоксов для выбора вакансий
 */

import type { HHEmployerPageType } from "../../parsers/hh-employer";
import { getSelectedIds, setSelectedIds, toggleSelection } from "./storage";

const CHECKBOX_CLASS = "recruitment-assistant-vacancy-checkbox";

/** Нативные чекбоксы HH: span[data-qa^="vacancies-dashboard-vacancy-archive-label"] input[type="checkbox"] */
export const ARCHIVE_CHECKBOX_SELECTOR =
  '[data-qa^="vacancies-dashboard-vacancy-archive-label"] input[type="checkbox"]';

let archiveOnUpdate: (() => void) | null = null;
let archiveListenerBound = false;

/** Извлекает externalId вакансии из чекбокса или родительской строки (HH не всегда ставит value) */
function getArchiveVacancyId(checkbox: HTMLInputElement): string | null {
  const val = checkbox.value?.trim();
  if (val && val !== "on") return val;

  const row = checkbox.closest('div[data-qa^="vacancy-archive_"]');
  const dataQa = row?.getAttribute("data-qa") || "";
  const match = dataQa.match(/vacancy-archive_(\d+)/);
  return match?.[1] ?? null;
}

function bindArchiveChangeListener(): void {
  if (archiveListenerBound) return;
  archiveListenerBound = true;
  document.addEventListener(
    "change",
    (e) => {
      const target = e.target as HTMLInputElement;
      if (
        target?.type === "checkbox" &&
        target.closest("[data-qa^='vacancies-dashboard-vacancy-archive-label']")
      ) {
        const id = getArchiveVacancyId(target);
        if (id) {
          void toggleSelection(id).then(() => archiveOnUpdate?.());
        }
      }
    },
    true,
  );
}

/** Ждёт появления контейнера архивных вакансий (HH грузит их асинхронно) */
function whenArchiveReady(cb: () => void): void {
  const root = document.querySelector("div.vacancy-dashboard-archive");
  if (root) {
    cb();
    return;
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector("div.vacancy-dashboard-archive")) {
      observer.disconnect();
      cb();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function runNativeCheckboxBinding(
  pageType: HHEmployerPageType,
  onUpdate: () => void,
): void {
  if (pageType === "vacancy-responses") return;

  if (pageType === "archived-vacancies") {
    archiveOnUpdate = onUpdate;
    // Вешаем listener сразу на document — сработает для любых чекбоксов, включая появившиеся позже
    bindArchiveChangeListener();
    // Sync и update — после появления списка
    whenArchiveReady(() => {
      void syncStorageFromNativeCheckboxes(pageType);
      onUpdate();
    });
    return;
  }

  injectCheckboxesForActive(pageType, onUpdate);
}

export async function syncStorageFromNativeCheckboxes(
  pageType: HHEmployerPageType,
): Promise<void> {
  if (pageType !== "archived-vacancies") return;

  const ids = await getSelectedIds();
  document.querySelectorAll(ARCHIVE_CHECKBOX_SELECTOR).forEach((input) => {
    const cb = input as HTMLInputElement;
    const id = getArchiveVacancyId(cb);
    if (id && cb.checked) ids.add(id);
  });
  await setSelectedIds(ids);
}

/** Извлекает externalId из строки активной вакансии (поддержка разных структур HH) */
function getActiveVacancyId(row: Element): string | null {
  const dataQa = row.getAttribute("data-qa") || "";
  const match = dataQa.match(/vacancy-active_(\d+)/);
  if (match?.[1]) return match[1];

  const titleEl = row.querySelector(
    '[data-qa="vacancy-serp__vacancy-title"], a[data-qa="vacancies-dashboard-vacancy-name"]',
  ) as HTMLAnchorElement;
  return titleEl?.href?.match(/\/vacancy\/(\d+)/)?.[1] ?? null;
}

function injectCheckboxesForActive(
  pageType: HHEmployerPageType,
  onUpdate: () => void,
): void {
  const selectedIdsPromise = getSelectedIds();

  const rowSelectors =
    '[data-qa="vacancy-serp__vacancy"], div[data-qa^="vacancy-active_"]';
  document.querySelectorAll(rowSelectors).forEach((row) => {
    if (row.querySelector(`.${CHECKBOX_CLASS}`)) return;

    const externalId = getActiveVacancyId(row);
    if (!externalId) return;

    selectedIdsPromise.then((ids) => {
      const wrap = document.createElement("div");
      wrap.className = `${CHECKBOX_CLASS}-wrap`;
      wrap.style.cssText =
        "display:inline-flex;align-items:center;margin-right:8px;flex-shrink:0;";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = CHECKBOX_CLASS;
      cb.dataset.externalId = externalId;
      cb.checked = ids.has(externalId);
      cb.title = "Выбрать для импорта";
      cb.style.cssText =
        "width:18px;height:18px;cursor:pointer;accent-color:#2563eb;";

      cb.addEventListener("change", async () => {
        await toggleSelection(externalId);
        onUpdate();
      });

      wrap.appendChild(cb);
      row.insertBefore(wrap, row.firstChild);
    });
  });

  const observer = new MutationObserver(() => {
    injectCheckboxesForActive(pageType, onUpdate);
  });
  const listEl =
    document.querySelector(
      '[data-qa="vacancy-serp"], div[data-qa~="vacancies-dashboard-manager"]',
    ) ?? document.body;
  observer.observe(listEl, { childList: true, subtree: true });
}

export function getCheckboxClass(): string {
  return CHECKBOX_CLASS;
}

/** Считает отмеченные чекбоксы по DOM — источник правды для текущей страницы */
export function getCheckedCountFromDOM(
  pageType: "active-vacancies" | "archived-vacancies",
): number {
  if (pageType === "archived-vacancies") {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      ARCHIVE_CHECKBOX_SELECTOR,
    );
    return [...inputs].filter((cb) => cb.checked).length;
  }
  return document.querySelectorAll<HTMLInputElement>(
    `input.${CHECKBOX_CLASS}:checked`,
  ).length;
}
