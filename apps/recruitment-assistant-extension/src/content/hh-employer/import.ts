/**
 * Логика импорта вакансий и откликов через API
 */

import { getExtensionApiUrl } from "../../config";
import {
  FETCH_DELAY_MS,
  fetchResumeTextHtml,
  fetchVacancyPrintHtml,
  type HHEmployerPageType,
  type ParsedResponse,
} from "../../parsers/hh-employer";
import { setSelectedIds } from "./storage";
import { collectAllResponses, collectAllVacancies, collectSelectedVacancies } from "./collectors";
import type { ImportProgress, ImportResult } from "./types";

export type { ImportProgress, ImportResult } from "./types";

export async function runVacanciesImportSelected(
  selectedIds: string[],
  pageType: HHEmployerPageType,
  workspaceId: string,
  token: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const idsSet = new Set(selectedIds);
  if (idsSet.size === 0) {
    return { success: false, error: "Выберите вакансии галочками" };
  }

  const isActive = pageType === "active-vacancies";

  try {
    onProgress?.({
      stage: "vacancies",
      current: 0,
      total: idsSet.size,
      message: "Сбор выбранных вакансий...",
    });

    const vacancies = await collectSelectedVacancies(
      idsSet,
      isActive,
      (cur, total) => {
        onProgress?.({
          stage: "vacancies",
          current: cur,
          total,
          message: `Собрано: ${cur} из ${total}`,
        });
      },
    );

    if (vacancies.length === 0) {
      return {
        success: false,
        error: "Выбранные вакансии не найдены. Откройте страницу с ними.",
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
            isActive: v.isActive,
          })),
        },
      },
    });

    if (!response?.success) {
      return {
        success: false,
        error: response?.error || "Ошибка при импорте",
      };
    }

    const data = response.data as {
      imported?: number;
      updated?: number;
      savedExternalIds?: string[];
    };
    const imported = (data?.imported ?? 0) + (data?.updated ?? 0);
    const savedIds = new Set(data?.savedExternalIds ?? []);

    if (savedIds.size > 0) {
      const toParse = vacancies.filter((v) => savedIds.has(v.externalId));
      for (let i = 0; i < toParse.length; i++) {
        const v = toParse[i];
        if (!v?.url) continue;
        try {
          onProgress?.({
            stage: "vacancies",
            current: i,
            total: toParse.length,
            message: `Парсинг описания: ${i + 1}/${toParse.length}`,
          });
          const html = await fetchVacancyPrintHtml(v.url);
          await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl("hh-import/parse-vacancy-html"),
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: {
                workspaceId,
                vacancyExternalId: v.externalId,
                vacancyUrl: v.url,
                htmlContent: html,
                isArchived: !v.isActive,
                region: v.region,
              },
            },
          });
        } catch (_e) {
          // Пропускаем ошибки парсинга отдельных вакансий
        }
        await new Promise((r) => setTimeout(r, FETCH_DELAY_MS));
      }
    }

    await setSelectedIds(new Set());
    return { success: true, vacanciesImported: imported };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Неизвестная ошибка",
    };
  }
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

    const data = response.data as {
      imported?: number;
      updated?: number;
      savedExternalIds?: string[];
    };
    const imported = (data?.imported ?? 0) + (data?.updated ?? 0);
    const savedIds = new Set(data?.savedExternalIds ?? []);

    if (savedIds.size > 0) {
      const toParse = vacancies.filter((v) => savedIds.has(v.externalId));
      for (let i = 0; i < toParse.length; i++) {
        const v = toParse[i];
        if (!v?.url) continue;
        try {
          onProgress?.({
            stage: "vacancies",
            current: i,
            total: toParse.length,
            message: `Парсинг описания: ${i + 1}/${toParse.length}`,
          });
          const html = await fetchVacancyPrintHtml(v.url);
          await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl("hh-import/parse-vacancy-html"),
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: {
                workspaceId,
                vacancyExternalId: v.externalId,
                vacancyUrl: v.url,
                htmlContent: html,
                isArchived: !v.isActive,
                region: v.region,
              },
            },
          });
        } catch (_e) {
          // Пропускаем ошибки парсинга отдельных вакансий
        }
        await new Promise((r) => setTimeout(r, FETCH_DELAY_MS));
      }
    }

    return {
      success: true,
      vacanciesImported: imported,
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

    const responsesToSend = responses.map((r: ParsedResponse) => ({
      resumeId: r.resumeId,
      resumeUrl: r.resumeUrl,
      name: r.name,
      respondedAt: r.respondedAt,
      status: r.status,
      coverLetter: r.coverLetter,
      photoUrl: r.photoUrl,
      resumeTextHtml: undefined as string | undefined,
    }));

    // Загрузка текстовой версии резюме (HTML) для отправки на сервер
    if (fetchResumeDetails) {
      onProgress?.({
        stage: "resume-details",
        current: 0,
        total: responses.length,
        message: "Загрузка текстовых версий резюме...",
      });

      for (let i = 0; i < responses.length; i++) {
        const r = responses[i];
        if (r?.resumeUrl) {
          try {
            const textHtml = await fetchResumeTextHtml(r.resumeUrl, r.name);
            const item = responsesToSend[i];
            if (item) {
              item.resumeTextHtml = textHtml;
            }
          } catch (_e) {
            // Пропускаем ошибки отдельных резюме
          }
          await new Promise((res) => setTimeout(res, FETCH_DELAY_MS));
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
