/**
 * Улучшенная логика импорта с имитацией человеческого поведения
 */

import { getExtensionApiUrl } from "../../config";
import {
  fetchPhotoAsBase64,
  fetchResumePdfAsBase64,
  fetchResumeTextHtml,
  fetchVacancyPrintHtml,
  getResumePdfUrl,
  type HHEmployerPageType,
  type ParsedResponse,
} from "../../parsers/hh-employer";
import {
  checkAndPauseIfNeeded,
  checkImportLimit,
  getRandomDelay,
} from "../../utils/stealth";
import {
  collectAllVacancies,
  collectResponsesStreaming,
  collectSelectedVacancies,
  collectSelectedVacanciesFromCurrentPage,
} from "./collectors";
import type { ImportProgress, ImportResult } from "./types";

export type { ImportProgress, ImportResult } from "./types";

export async function runVacanciesImportSelected(
  pageType: HHEmployerPageType,
  workspaceId: string,
  token: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const isActive = pageType === "active-vacancies";

  try {
    onProgress?.({
      stage: "vacancies",
      current: 0,
      total: 1,
      message: "Сбор выбранных вакансий...",
    });

    const vacancies = collectSelectedVacanciesFromCurrentPage(isActive);

    if (vacancies.length === 0) {
      return {
        success: false,
        error: "Выберите вакансии галочками на текущей странице",
      };
    }

    onProgress?.({
      stage: "vacancies",
      current: vacancies.length,
      total: vacancies.length,
      message: `Найдено выбранных: ${vacancies.length}`,
    });

    const response = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl("hh-import/vacancies"),
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

        // Случайная задержка 2-3.5 секунды
        const delay = getRandomDelay(2000, 1500);
        await new Promise((r) => setTimeout(r, delay));

        // Пауза после каждых 10 вакансий (5-10 секунд)
        await checkAndPauseIfNeeded(i, 10);
      }
    }

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
        url: getExtensionApiUrl("hh-import/vacancies"),
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

        // Случайная задержка 2-3.5 секунды
        const delay = getRandomDelay(2000, 1500);
        await new Promise((r) => setTimeout(r, delay));

        // Пауза после каждых 10 вакансий (5-10 секунд)
        await checkAndPauseIfNeeded(i, 10);
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
      message: "Проверка вакансии...",
    });

    const checkResponse = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: {
        url: getExtensionApiUrl("hh-import/check-vacancy"),
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: {
          workspaceId,
          vacancyExternalId,
        },
      },
    });

    if (!checkResponse?.success) {
      return {
        success: false,
        error:
          checkResponse?.error ||
          "Не удалось проверить наличие вакансии на сервере",
      };
    }

    const checkData = checkResponse.data as { exists?: boolean };
    if (checkData?.exists !== true) {
      return {
        success: false,
        error:
          "Вакансия не найдена в системе. Сначала импортируйте вакансию со страницы списка вакансий.",
      };
    }

    onProgress?.({
      stage: "responses",
      current: 0,
      total: 1,
      message: "Импорт откликов...",
    });

    const limitCheck = checkImportLimit(100, 100);
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message || "Превышен лимит импорта",
      };
    }

    let totalImported = 0;

    const processOneResponse = async (r: ParsedResponse, index: number) => {
      let photoUrl: string | undefined = r.photoUrl;
      if (photoUrl) {
        try {
          const photoData = await fetchPhotoAsBase64(photoUrl);
          if (photoData?.base64) {
            photoUrl = `data:${photoData.contentType};base64,${photoData.base64}`;
          }
        } catch (e) {
          console.error(`[Import] Ошибка загрузки фото для ${r.name}:`, e);
          photoUrl = undefined;
        }
      }

      let resumeTextHtml: string | undefined;
      let resumePdfBase64: string | undefined;
      if (fetchResumeDetails && r.resumeUrl) {
        try {
          resumeTextHtml = await fetchResumeTextHtml(r.resumeUrl, r.name);
        } catch (_e) {
          // пропускаем ошибки
        }
        try {
          const pdfUrl = getResumePdfUrl(
            r.resumeUrl,
            r.name,
            window.location.origin,
          );
          if (pdfUrl) {
            const pdfData = await fetchResumePdfAsBase64(pdfUrl);
            if (pdfData?.base64) {
              resumePdfBase64 = `data:${pdfData.contentType};base64,${pdfData.base64}`;
            }
          }
        } catch (e) {
          console.error(`[Import] Ошибка загрузки PDF для ${r.name}:`, e);
        }
      }

      const item = {
        resumeId: r.resumeId,
        resumeUrl: r.resumeUrl,
        name: r.name,
        respondedAt: r.respondedAt,
        status: r.status,
        coverLetter: r.coverLetter ?? "",
        photoUrl,
        resumeTextHtml,
        resumePdfBase64,
      };

      const response = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl("hh-import/responses"),
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: {
            workspaceId,
            vacancyId: vacancyId || undefined,
            vacancyExternalId,
            responses: [
              {
                resumeId: item.resumeId,
                resumeUrl: item.resumeUrl,
                name: item.name,
                respondedAt: item.respondedAt,
                status: item.status,
                coverLetter: item.coverLetter,
                photoUrl: item.photoUrl,
                resumeTextHtml: item.resumeTextHtml,
              },
            ],
          },
        },
      });

      if (!response?.success) {
        throw new Error(response?.error || "Ошибка при импорте откликов");
      }

      const data = response.data as { imported?: number };
      totalImported += data?.imported ?? 1;

      if (item.resumePdfBase64) {
        try {
          await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl("hh-import/upload-resume-pdf"),
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: {
                workspaceId,
                vacancyExternalId,
                resumeId: item.resumeId,
                resumePdfBase64: item.resumePdfBase64,
              },
            },
          });
        } catch (e) {
          console.error(`[Import] Ошибка загрузки PDF для ${item.name}:`, e);
        }
      }

      if (fetchResumeDetails && r.resumeUrl) {
        const delay = getRandomDelay(2000, 1500);
        await new Promise((res) => setTimeout(res, delay));
      }

      await checkAndPauseIfNeeded(index, 15);
    };

    const processed = await collectResponsesStreaming(
      vacancyExternalId,
      processOneResponse,
      (processedCount, estimatedTotal) => {
        onProgress?.({
          stage: "responses",
          current: processedCount,
          total: estimatedTotal,
          message: `Обработано: ${processedCount}, импортировано: ${totalImported}`,
        });
      },
      { maxResponses: 100 },
    );

    if (processed === 0) {
      return {
        success: false,
        error: "Не найдено откликов на странице",
      };
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
