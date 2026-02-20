/**
 * Логика импорта вакансий и откликов через API с поддержкой фото
 */

import { getExtensionApiUrl } from "../../config";
import {
  FETCH_DELAY_MS,
  fetchPhotoAsBase64,
  fetchResumeTextHtml,
  fetchVacancyPrintHtml,
  type HHEmployerPageType,
  type ParsedResponse,
} from "../../parsers/hh-employer";
import { setSelectedIds } from "./storage";
import { collectAllResponses, collectAllVacancies, collectSelectedVacancies } from "./collectors";
import type { ImportProgress, ImportResult } from "./types";

export type { ImportProgress, ImportResult } from "./types";

// ... (функции runVacanciesImportSelected и runVacanciesImport остаются без изменений)

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
      photoBase64: undefined as string | undefined,
      photoContentType: undefined as string | undefined,
      resumeTextHtml: undefined as string | undefined,
    }));

    // Загрузка фото кандидатов
    if (fetchResumeDetails) {
      onProgress?.({
        stage: "resume-details",
        current: 0,
        total: responses.length,
        message: "Загрузка фото кандидатов...",
      });

      for (let i = 0; i < responses.length; i++) {
        const r = responses[i];
        const item = responsesToSend[i];
        
        // Скачиваем фото, если есть URL
        if (r?.photoUrl && item) {
          try {
            const photoData = await fetchPhotoAsBase64(r.photoUrl);
            item.photoBase64 = photoData.base64;
            item.photoContentType = photoData.contentType;
          } catch (_e) {
            // Пропускаем ошибки загрузки фото
          }
          await new Promise((res) => setTimeout(res, FETCH_DELAY_MS));
        }

        // Загрузка текстовой версии резюме
        if (r?.resumeUrl && item) {
          try {
            const textHtml = await fetchResumeTextHtml(r.resumeUrl, r.name);
            item.resumeTextHtml = textHtml;
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
