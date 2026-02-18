/**
 * Content script для страниц HH employer (вакансии, отклики)
 * Позволяет выбирать вакансии галочками и импортировать через popup
 */

import {
  detectHHEmployerPageType,
  getSelectedIds,
  initHHEmployerContentScript,
  runResponsesImport,
  runVacanciesImport,
  runVacanciesImportSelected,
} from "./hh-employer";
import { resolveAuth } from "./hh-employer/auth";
import { getVacancyIdFromResponsesPage } from "../parsers/hh-employer";

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

      getSelectedIds().then(async (ids) => {
        if (ids.size === 0) {
          sendResponse({ ok: false, error: "Выберите вакансии галочками" });
          return;
        }

        const auth = await resolveAuth();
        if (!auth.ok) {
          sendResponse({
            ok: false,
            error:
              auth.error === "no-token"
                ? "Войдите в систему"
                : "Выберите workspace",
          });
          return;
        }

        try {
          const result = await runVacanciesImportSelected(
            [...ids],
            pageType,
            auth.context.workspaceId,
            auth.context.token,
          );
          sendResponse({
            ok: result.success,
            error: result.error,
            vacanciesImported: result.vacanciesImported,
          });
        } catch (e) {
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : "Неизвестная ошибка",
          });
        }
      });
      return true;
    }

    if (msg?.type === "IMPORT_ALL_VACANCIES") {
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
                : "Выберите workspace",
          });
          return;
        }
        try {
          const result = await runVacanciesImport(
            pageType,
            auth.context.workspaceId,
            auth.context.token,
          );
          sendResponse({
            ok: result.success,
            error: result.error,
            vacanciesImported: result.vacanciesImported,
          });
        } catch (e) {
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
                : "Выберите workspace",
          });
          return;
        }
        try {
          const result = await runResponsesImport(
            vacancyExternalId,
            "",
            auth.context.workspaceId,
            auth.context.token,
            false,
          );
          sendResponse({
            ok: result.success,
            error: result.error,
            responsesImported: result.responsesImported,
          });
        } catch (e) {
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : "Неизвестная ошибка",
          });
        }
      });
      return true;
    }

    if (msg?.type === "GET_SELECTED_VACANCIES_COUNT") {
      getSelectedIds().then((ids) => {
        sendResponse({ count: ids.size });
      });
      return true;
    }

    return false;
  },
);
