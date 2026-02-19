import {
  getResponsesNeedingDetailsForVacancy,
  hasDetailedInfo,
} from "@qbs-autonaim/jobs-shared";
import type { Page } from "puppeteer";
import type { ResponseData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { enrichResumeData } from "../../services/resume-enrichment";
import { parseResponseDate } from "../../utils/date-utils";
import { humanScroll } from "../../utils/human-behavior";

interface ResponseWithId {
  name: string;
  url: string;
  resumeId: string;
  resumeUrl?: string;
  externalId?: string;
  respondedAt?: Date;
  status?: string;
  coverLetter?: string;
  vacancyId?: string;
  /** ID на платформе (HH resume ID) */
  candidateId?: string;
  /** UUID связи с global_candidates */
  globalCandidateId?: string | null;
}

/**
 * Фильтрует отклики, которые нуждаются в парсинге детальной информации
 */
export async function filterResponsesNeedingDetails(
  responses: ResponseData[],
  vacancyId: string,
): Promise<ResponseWithId[]> {
  const responsesNeedingDetails: ResponseWithId[] = [];

  for (const response of responses) {
    if (!response.resumeId) continue;

    try {
      const result = await hasDetailedInfo(vacancyId, response.resumeId);
      if (result.success && result.data === false) {
        responsesNeedingDetails.push({
          ...response,
          resumeId: response.resumeId,
          resumeUrl: response.url, // Переименовываем url в resumeUrl
          respondedAt: parseResponseDate(response.respondedAt || ""),
        });
      }
    } catch (error) {
      console.error(
        `❌ Ошибка проверки деталей для отклика ${response.externalId}:`,
        error,
      );
    }
  }

  return responsesNeedingDetails;
}

/**
 * Парсит детальную информацию для всех откликов вакансии, которым она нужна.
 * Загружает список из БД и парсит через Puppeteer.
 */
export async function parseResponseDetailsForVacancy(
  page: Page,
  vacancyId: string,
  onProgress?: (
    processed: number,
    total: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<void> {
  const responsesNeedingDetails =
    await getResponsesNeedingDetailsForVacancy(vacancyId);

  if (responsesNeedingDetails.length === 0) {
    console.log("ℹ️ Все отклики уже имеют детальную информацию");
    return;
  }

  const mappedResponses = responsesNeedingDetails.map((r) => ({
    name: r.candidateName ?? "",
    url: r.profileUrl ?? "",
    resumeId: r.resumeId,
    resumeUrl: r.profileUrl ?? undefined,
    vacancyId,
    candidateId: r.candidateId ?? undefined,
    globalCandidateId: r.globalCandidateId ?? null,
  }));

  await parseResponseDetails(page, mappedResponses, vacancyId, onProgress);
}

/**
 * Парсит детальную информацию резюме для массива откликов
 */
export async function parseResponseDetails(
  page: Page,
  responses: ResponseWithId[],
  vacancyId: string,
  onProgress?: (
    processed: number,
    total: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`🔍 Начинаем парсинг деталей для ${responses.length} откликов`);

  const total = responses.length;

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response || !response.resumeUrl) {
      console.warn(`⚠️ Пропускаем отклик ${i + 1}: отсутствуют данные`);
      continue;
    }

    try {
      console.log(
        `📄 Парсим детали для отклика ${i + 1}/${responses.length}: ${response.name}`,
      );

      // Отправляем прогресс перед началом обработки
      await onProgress?.(i + 1, total, response.name);

      // Переходим на страницу резюме
      await page.goto(response.resumeUrl, {
        waitUntil: "domcontentloaded",
        timeout: HH_CONFIG.timeouts.navigation,
      });

      await page.waitForNetworkIdle({
        timeout: HH_CONFIG.timeouts.networkIdle,
      });

      // Имитируем чтение страницы
      await humanScroll(page);

      // Используем функцию обогащения резюме, которая:
      // - парсит все данные резюме
      // - загружает PDF и фото в S3
      // - извлекает контакты (email, phone, telegram, whatsapp)
      // - создает/обновляет глобального кандидата
      // - сохраняет все данные в базу
      const result = await enrichResumeData({
        page,
        entityId: response.vacancyId || vacancyId,
        resumeId: response.resumeId,
        resumeUrl: response.resumeUrl,
        candidateName: response.name,
        globalCandidateId: response.globalCandidateId ?? null,
        traceId: `archived-${response.resumeId}`,
      });

      if (result.success) {
        console.log(`✅ Детали обогащены для: ${response.name}`);
      } else {
        console.error(
          `❌ Ошибка обогащения для ${response.name}: ${result.error}`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Ошибка парсинга деталей для ${response.externalId || response.resumeId}:`,
        error,
      );
    }
  }
}
