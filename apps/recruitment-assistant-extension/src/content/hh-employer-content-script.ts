/**
 * Content script для страниц HH employer (вакансии, отклики)
 * Позволяет импортировать вакансии и отклики в систему
 */

import { getExtensionApiUrl } from "../config";
import {
  detectHHEmployerPageType,
  fetchResumeHtml,
  FETCH_DELAY_MS,
  getNextPageButton,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  parseResumeFromHtml,
  parseResponsesFromDOM,
  type HHEmployerPageType,
  type ParsedResponse,
  type ParsedVacancy,
} from "../parsers/hh-employer";

const MESSAGE_SOURCE = "recruitment-assistant-hh-employer";

export interface ImportProgress {
  stage: "vacancies" | "responses" | "resume-details";
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  vacanciesImported?: number;
  responsesImported?: number;
  error?: string;
}

/**
 * Собирает все вакансии (с пагинацией)
 */
async function collectAllVacancies(
  isActive: boolean,
  onProgress?: (current: number, total: number) => void,
): Promise<ParsedVacancy[]> {
  const all: ParsedVacancy[] = [];
  let pageNum = 0;

  const parseFn = isActive ? parseActiveVacanciesFromDOM : parseArchivedVacanciesFromDOM;

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

/**
 * Собирает все отклики (с пагинацией)
 */
async function collectAllResponses(
  vacancyExternalId: string,
  onProgress?: (current: number, total: number) => void,
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

    onProgress?.(all.length, all.length + (pageItems.length > 0 ? 20 : 0));

    const nextBtn = document.querySelector('[data-qa="pager-next"]');
    if (!nextBtn) break;

    (nextBtn as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1500));
    pageNum++;
    if (pageNum >= 100) break;
  }

  return all;
}

export async function runVacanciesImport(
  pageType: HHEmployerPageType,
  workspaceId: string,
  token: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const isActive =
    pageType === "active-vacancies" || pageType === "archived-vacancies"
      ? pageType === "active-vacancies"
      : true;

  try {
    onProgress?.({
      stage: "vacancies",
      current: 0,
      total: 100,
      message: "Сбор вакансий...",
    });

    const vacancies = await collectAllVacancies(isActive, (cur, total) => {
      onProgress?.({
        stage: "vacancies",
        current: cur,
        total,
        message: `Собрано вакансий: ${cur}`,
      });
    });

    if (vacancies.length === 0) {
      return {
        success: false,
        error: "Не найдено вакансий на странице",
      };
    }

    const response = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl("hh-import?type=vacancies"),
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: {
          workspaceId,
          vacancies: vacancies.map((v) => ({
              externalId: v.externalId,
              title: v.title,
              url: v.url,
              region: v.region,
              views: v.views || "0",
              responses: v.responses || "0",
              isActive: v.isActive,
            })),
        },
      },
    });

    if (!response?.success) {
      return {
        success: false,
        error: response?.error || "Ошибка при импорте вакансий",
      };
    }

    const data = response.data as { imported?: number; updated?: number };
    return {
      success: true,
      vacanciesImported: (data?.imported ?? 0) + (data?.updated ?? 0),
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Неизвестная ошибка",
    };
  }
}

export async function runResponsesImport(
  vacancyExternalId: string,
  vacancyId: string,
  workspaceId: string,
  token: string,
  fetchResumeDetails: boolean,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  try {
    onProgress?.({
      stage: "responses",
      current: 0,
      total: 1,
      message: "Сбор откликов...",
    });

    const responses = await collectAllResponses(vacancyExternalId, (cur) => {
      onProgress?.({
        stage: "responses",
        current: cur,
        total: cur + 20,
        message: `Собрано откликов: ${cur}`,
      });
    });

    if (responses.length === 0) {
      return {
        success: false,
        error: "Не найдено откликов на странице",
      };
    }

    let responsesToSend = responses.map((r) => ({
      resumeId: r.resumeId,
      resumeUrl: r.resumeUrl,
      name: r.name,
      respondedAt: r.respondedAt,
      status: r.status,
      coverLetter: r.coverLetter,
      email: undefined as string | undefined,
      phone: undefined as string | undefined,
      experience: undefined as string | undefined,
      education: undefined as string | undefined,
      skills: undefined as string[] | undefined,
    }));

    if (fetchResumeDetails && responses.length <= 100) {
      onProgress?.({
        stage: "resume-details",
        current: 0,
        total: responses.length,
        message: "Загрузка деталей резюме...",
      });

      for (let i = 0; i < responses.length; i++) {
        const r = responses[i];
        if (r?.resumeUrl) {
          try {
            const html = await fetchResumeHtml(r.resumeUrl);
            const details = parseResumeFromHtml(html);
            const item = responsesToSend[i];
            if (item) {
              item.email = details.email ?? undefined;
              item.phone = details.phone ?? undefined;
              item.experience = details.experience || undefined;
              item.education = details.education || undefined;
              item.skills = details.skills.length ? details.skills : undefined;
            }
          } catch (_e) {
            // Пропускаем ошибки отдельных резюме
          }
          await new Promise((r) => setTimeout(r, FETCH_DELAY_MS));
        }
        onProgress?.({
          stage: "resume-details",
          current: i + 1,
          total: responses.length,
          message: `Обработано резюме: ${i + 1}/${responses.length}`,
        });
      }
    }

    const batchSize = 50;
    let totalImported = 0;

    for (let i = 0; i < responsesToSend.length; i += batchSize) {
      const batch = responsesToSend.slice(i, i + batchSize);
      const response = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl("hh-import?type=responses"),
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: {
            workspaceId,
            vacancyId: vacancyId || undefined,
            vacancyExternalId,
            responses: batch,
          },
        },
      });

      if (!response?.success) {
        return {
          success: false,
          error: response?.error || "Ошибка при импорте откликов",
        };
      }

      const data = response.data as { imported?: number };
      totalImported += data?.imported ?? batch.length;
    }

    return {
      success: true,
      responsesImported: totalImported,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Неизвестная ошибка",
    };
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

  const button = document.createElement("button");
  button.type = "button";
  button.textContent =
    pageType === "vacancy-responses"
      ? "Импортировать отклики"
      : "Импортировать вакансии";
  button.style.cssText = `
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: #2563eb;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;
  button.addEventListener("mouseenter", () => {
    button.style.background = "#1d4ed8";
  });
  button.addEventListener("mouseleave", () => {
    button.style.background = "#2563eb";
  });

  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = `
    margin-top: 8px;
    font-size: 13px;
    color: #374151;
    max-width: 280px;
  `;

  container.appendChild(button);
  container.appendChild(statusDiv);
  document.body.appendChild(container);

  button.addEventListener("click", async () => {
    const { authToken, userData } = await chrome.storage.local.get([
      "authToken",
      "userData",
    ]);
    const token = authToken as string | undefined;
    const user = userData as { organizationId?: string } | undefined;
    const workspaceId = (userData as { workspaceId?: string })?.workspaceId as
      | string
      | undefined;

    if (!token) {
      statusDiv.textContent = "Войдите в систему через расширение";
      statusDiv.style.color = "#dc2626";
      return;
    }

    let wsId = workspaceId;
    if (!wsId && user?.organizationId) {
      const workspacesResp = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl(`workspaces?organizationId=${encodeURIComponent(user.organizationId)}`),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      if (workspacesResp?.success && Array.isArray(workspacesResp.data) && workspacesResp.data.length > 0) {
        wsId = workspacesResp.data[0].id;
        await chrome.storage.local.set({ workspaceId: wsId });
      }
    }

    if (!wsId) {
      statusDiv.textContent = "Выберите workspace в настройках расширения";
      statusDiv.style.color = "#dc2626";
      return;
    }

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
          token,
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
          token,
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initHHEmployerContentScript());
} else {
  initHHEmployerContentScript();
}
