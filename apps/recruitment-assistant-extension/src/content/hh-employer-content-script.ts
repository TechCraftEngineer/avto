/**
 * Content script для страниц HH employer (вакансии, отклики)
 * Позволяет выбирать вакансии галочками и импортировать через popup
 */

import { getVacancyIdFromResponsesPage } from "../parsers/hh-employer";
import { IMPORT_PROGRESS_KEY } from "../shared/import-progress";
import {
  detectHHEmployerPageType,
  getCheckedCountFromDOM,
  initHHEmployerContentScript,
  runResponsesImport,
  runVacanciesImportSelected,
} from "./hh-employer";
import { resolveAuth } from "./hh-employer/auth";
import type { ImportProgress } from "./hh-employer/types";

function reportProgress(p: ImportProgress) {
  void chrome.storage.local.set({ [IMPORT_PROGRESS_KEY]: p });
}

function clearProgress() {
  void chrome.storage.local.remove(IMPORT_PROGRESS_KEY);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    initHHEmployerContentScript(),
  );
} else {
  initHHEmployerContentScript();
}

chrome.runtime.onMessage.addListener(
  (msg: { type?: string }, _sender, sendResponse) => {
    if (msg?.type === "IMPORT_SELECTED_VACANCIES") {
      const pageType = detectHHEmployerPageType();
      if (
        pageType !== "active-vacancies" &&
        pageType !== "archived-vacancies"
      ) {
        sendResponse({ ok: false, error: "Не страница вакансий" });
        return false;
      }

      resolveAuth().then(async (auth) => {
        if (!auth.ok) {
          sendResponse({
            ok: false,
            error:
              auth.error === "no-token"
                ? "Войдите в систему"
                : "Выберите рабочее пространство",
          });
          return;
        }

        try {
          const result = await runVacanciesImportSelected(
            pageType,
            auth.context.workspaceId,
            auth.context.token,
            reportProgress,
          );
          clearProgress();
          sendResponse({
            ok: result.success,
            error: result.error,
            vacanciesImported: result.vacanciesImported,
          });
        } catch (e) {
          clearProgress();
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : "Неизвестная ошибка",
          });
        }
      });
      return true;
    }

    if (msg?.type === "IMPORT_RESPONSES") {
      const pageType = detectHHEmployerPageType();
      if (pageType !== "vacancy-responses") {
        sendResponse({ ok: false, error: "Не страница откликов" });
        return false;
      }

      const vacancyExternalId = getVacancyIdFromResponsesPage();
      if (!vacancyExternalId) {
        sendResponse({ ok: false, error: "Не удалось определить вакансию" });
        return false;
      }

      resolveAuth().then(async (auth) => {
        if (!auth.ok) {
          sendResponse({
            ok: false,
            error:
              auth.error === "no-token"
                ? "Войдите в систему"
                : "Выберите рабочее пространство",
          });
          return;
        }
        try {
          const result = await runResponsesImport(
            vacancyExternalId,
            "",
            auth.context.workspaceId,
            auth.context.token,
            true, // fetchResumeDetails: парсим текст резюме и фото
            reportProgress,
          );
          clearProgress();
          sendResponse({
            ok: result.success,
            error: result.error,
            responsesImported: result.responsesImported,
          });
        } catch (e) {
          clearProgress();
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : "Неизвестная ошибка",
          });
        }
      });
      return true;
    }

    if (msg?.type === "GET_SELECTED_VACANCIES_COUNT") {
      const pageType = detectHHEmployerPageType();
      if (
        pageType !== "active-vacancies" &&
        pageType !== "archived-vacancies"
      ) {
        sendResponse({ count: 0 });
        return false;
      }
      sendResponse({ count: getCheckedCountFromDOM(pageType) });
      return false;
    }

    return false;
  },
);
