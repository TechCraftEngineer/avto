/**
 * UI панели импорта на страницах HH employer
 */

import type { HHEmployerPageType } from "../../parsers/hh-employer";
import {
  detectHHEmployerPageType,
  parseActiveVacanciesFromDOM,
} from "../../parsers/hh-employer";
import { resolveAuth } from "./auth";
import {
  ARCHIVE_CHECKBOX_SELECTOR,
  getCheckboxClass,
  runNativeCheckboxBinding,
  syncStorageFromNativeCheckboxes,
} from "./checkboxes";
import {
  runResponsesImport,
  runVacanciesImport,
  runVacanciesImportSelected,
} from "./import";
import { getSelectedIds, setSelectedIds } from "./storage";

const btnStyle = `
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  margin-right: 8px;
  margin-bottom: 8px;
`;

async function handleImportSelected(
  pageType: HHEmployerPageType,
  statusDiv: HTMLDivElement,
  btnSelected: HTMLButtonElement | null,
  onUpdate: () => void,
): Promise<void> {
  const ids = await getSelectedIds();
  if (ids.size === 0) {
    statusDiv.textContent = "Выберите вакансии галочками";
    statusDiv.style.color = "#dc2626";
    return;
  }

  const auth = await resolveAuth();
  if (!auth.ok) {
    statusDiv.textContent = auth.message;
    statusDiv.style.color = "#dc2626";
    return;
  }

  if (btnSelected) btnSelected.disabled = true;
  statusDiv.textContent = "Запуск импорта выбранных...";
  statusDiv.style.color = "#374151";

  try {
    const result = await runVacanciesImportSelected(
      [...ids],
      pageType,
      auth.context.workspaceId,
      auth.context.token,
      (p) => {
        statusDiv.textContent = p.message;
      },
    );

    if (result.success) {
      statusDiv.textContent = `Импортировано: ${result.vacanciesImported ?? 0}`;
      statusDiv.style.color = "#16a34a";
      onUpdate();
    } else {
      statusDiv.textContent = result.error || "Ошибка";
      statusDiv.style.color = "#dc2626";
    }
  } finally {
    if (btnSelected) btnSelected.disabled = false;
  }
}

export function initHHEmployerContentScript(): void {
  const pageType = detectHHEmployerPageType();
  if (pageType === "unknown") return;

  const container = document.createElement("div");
  container.id = "recruitment-assistant-hh-employer-panel";
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = `
    margin-top: 8px;
    font-size: 13px;
    color: #374151;
    max-width: 280px;
  `;

  const updateSelectedCount = () => {
    getSelectedIds().then((ids) => {
      if (btnSelected)
        btnSelected.textContent = `Загрузить выбранные (${ids.size})`;
    });
  };

  let btnSelected: HTMLButtonElement | null = null;

  if (pageType !== "vacancy-responses") {
    runNativeCheckboxBinding(pageType, updateSelectedCount);

    const toolbar = document.createElement("div");
    toolbar.style.cssText =
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;";

    const btnSelectAll = document.createElement("button");
    btnSelectAll.type = "button";
    btnSelectAll.textContent = "Выбрать все";
    btnSelectAll.style.cssText = btnStyle + "background:#64748b;";
    btnSelectAll.addEventListener("click", async () => {
      if (pageType === "archived-vacancies") {
        document.querySelectorAll(ARCHIVE_CHECKBOX_SELECTOR).forEach((cb) => {
          (cb as HTMLInputElement).checked = true;
        });
        await syncStorageFromNativeCheckboxes(pageType);
      } else {
        const items = parseActiveVacanciesFromDOM();
        const ids = await getSelectedIds();
        for (const v of items) ids.add(v.externalId);
        await setSelectedIds(ids);
        document.querySelectorAll(`.${getCheckboxClass()}`).forEach((cb) => {
          (cb as HTMLInputElement).checked = true;
        });
      }
      updateSelectedCount();
    });

    const btnDeselectAll = document.createElement("button");
    btnDeselectAll.type = "button";
    btnDeselectAll.textContent = "Снять все";
    btnDeselectAll.style.cssText = btnStyle + "background:#64748b;";
    btnDeselectAll.addEventListener("click", async () => {
      await setSelectedIds(new Set());
      if (pageType === "archived-vacancies") {
        document.querySelectorAll(ARCHIVE_CHECKBOX_SELECTOR).forEach((cb) => {
          (cb as HTMLInputElement).checked = false;
        });
      } else {
        document.querySelectorAll(`.${getCheckboxClass()}`).forEach((cb) => {
          (cb as HTMLInputElement).checked = false;
        });
      }
      updateSelectedCount();
    });

    btnSelected = document.createElement("button");
    btnSelected.type = "button";
    btnSelected.textContent = "Загрузить выбранные (0)";
    btnSelected.style.cssText = btnStyle;
    btnSelected.addEventListener("click", () =>
      handleImportSelected(
        pageType,
        statusDiv,
        btnSelected,
        updateSelectedCount,
      ),
    );
    toolbar.appendChild(btnSelectAll);
    toolbar.appendChild(btnDeselectAll);
    toolbar.appendChild(btnSelected);
    container.appendChild(toolbar);
    updateSelectedCount();
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent =
    pageType === "vacancy-responses"
      ? "Импортировать отклики"
      : "Импортировать все вакансии";
  button.style.cssText = btnStyle;
  button.addEventListener("mouseenter", () => {
    button.style.background = "#1d4ed8";
  });
  button.addEventListener("mouseleave", () => {
    button.style.background = "#2563eb";
  });

  container.appendChild(button);
  container.appendChild(statusDiv);
  document.body.appendChild(container);

  button.addEventListener("click", async () => {
    const auth = await resolveAuth();
    if (!auth.ok) {
      statusDiv.textContent = auth.message;
      statusDiv.style.color = "#dc2626";
      return;
    }

    const wsId = auth.context.workspaceId;
    button.disabled = true;
    statusDiv.textContent = "Запуск импорта...";
    statusDiv.style.color = "#374151";

    try {
      if (pageType === "vacancy-responses") {
        const vacancyExternalId = new URLSearchParams(
          window.location.search,
        ).get("vacancyId");
        if (!vacancyExternalId) {
          statusDiv.textContent = "Не удалось определить вакансию";
          return;
        }

        const result = await runResponsesImport(
          vacancyExternalId,
          "", // vacancyId (DB) - API может найти по externalId
          wsId,
          auth.context.token,
          false, // fetchResumeDetails - отключаем по умолчанию (долго)
          (p) => {
            statusDiv.textContent = p.message;
          },
        );

        if (result.success) {
          statusDiv.textContent = `Импортировано откликов: ${result.responsesImported ?? 0}`;
          statusDiv.style.color = "#16a34a";
        } else {
          statusDiv.textContent = result.error || "Ошибка";
          statusDiv.style.color = "#dc2626";
        }
      } else {
        const result = await runVacanciesImport(
          pageType,
          wsId,
          auth.context.token,
          (p) => {
            statusDiv.textContent = p.message;
          },
        );

        if (result.success) {
          statusDiv.textContent = `Импортировано вакансий: ${result.vacanciesImported ?? 0}`;
          statusDiv.style.color = "#16a34a";
        } else {
          statusDiv.textContent = result.error || "Ошибка";
          statusDiv.style.color = "#dc2626";
        }
      }
    } finally {
      button.disabled = false;
    }
  });
}
