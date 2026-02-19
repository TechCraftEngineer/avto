import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import { getResponsesLimitByOrganizationPlan } from "@qbs-autonaim/jobs-shared";
import type { Page } from "puppeteer";
import type { ResponseData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { parseResponseDate } from "../../utils/date-utils";
import {
  filterResponsesNeedingDetails,
  parseResponseDetails,
} from "./response-utils";
import { scrollToLoadAllContent } from "../../utils/human-behavior";

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
  candidateId?: string;
}

export async function parseArchivedVacancyResponses(
  page: Page,
  vacancyId: string,
  externalId?: string | null,
  organizationPlan?: "free" | "starter" | "pro" | "enterprise",
  onProgress?: (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<{ syncedResponses: number; newResponses: number }> {
  console.log(
    `🚀 Начинаем парсинг откликов для архивной вакансии ${vacancyId}`,
  );

  // Строим стандартный URL для откликов
  if (!externalId) {
    throw new Error("Не указан externalId для вакансии");
  }

  const responsesUrl = `${HH_CONFIG.urls.baseUrl}/employer/vacancyresponses?vacancyId=${externalId}`;

  console.log(`📄 URL откликов: ${responsesUrl}`);

  console.log("\n📋 ЭТАП 1: Сбор всех откликов и сохранение в базу...");
  const { responses: allResponses, newCount } =
    await collectAllArchivedResponses(
      page,
      responsesUrl,
      vacancyId,
      organizationPlan,
      onProgress,
    );

  if (allResponses.length === 0) {
    console.log("⚠️ Не найдено откликов для обработки");
    return { syncedResponses: 0, newResponses: 0 };
  }

  console.log(
    `✅ Всего обработано откликов: ${allResponses.length} (новых: ${newCount})`,
  );

  console.log("\n🔍 ЭТАП 2: Поиск откликов без детальной информации...");
  // Convert ResponseWithId[] to ResponseData[] by converting Date to string
  const responsesAsData: ResponseData[] = allResponses.map((r) => ({
    ...r,
    respondedAt: r.respondedAt?.toISOString(),
  }));
  const responsesNeedingDetails = await filterResponsesNeedingDetails(
    responsesAsData,
    vacancyId,
  );

  console.log(
    `✅ Откликов требующих парсинга деталей: ${responsesNeedingDetails.length}`,
  );

  if (responsesNeedingDetails.length === 0) {
    console.log("ℹ️ Все отклики уже имеют детальную информацию");
    return { syncedResponses: allResponses.length, newResponses: newCount };
  }

  console.log("\n📊 ЭТАП 3: Парсинг детальной информации резюме...");
  await parseResponseDetails(
    page,
    responsesNeedingDetails,
    vacancyId,
    async (processed, _total, currentName) => {
      // totalResponses = всего откликов (responsesNeedingDetails — подмножество allResponses)
      const totalResponses = allResponses.length;
      // Обработано = отклики без деталей (уже после этапа 1) + отклики с деталями (processed)
      const totalProcessed =
        allResponses.length - responsesNeedingDetails.length + processed;
      await onProgress?.(totalProcessed, totalResponses, newCount, currentName);
    },
  );

  console.log(
    `\n🎉 Парсинг завершен! Обработано откликов: ${responsesNeedingDetails.length}`,
  );

  return { syncedResponses: allResponses.length, newResponses: newCount };
}

/** Параметры для синхронизации одной страницы (для возобновляемой загрузки) */
export interface SyncArchivedPageOptions {
  pageIndex: number;
  accumulatedCount: number;
  accumulatedNewCount: number;
  responsesLimit: number;
}

/**
 * Синхронизирует одну страницу откликов архивной вакансии.
 * Используется для возобновляемой загрузки через Inngest step loop.
 */
export async function parseArchivedVacancyResponsesPage(
  page: Page,
  responsesUrl: string,
  vacancyIdForSave: string,
  _organizationPlan: "free" | "starter" | "pro" | "enterprise" | undefined,
  options: SyncArchivedPageOptions,
  onProgress?: (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<{
  syncedResponses: number;
  newResponses: number;
  hasMore: boolean;
}> {
  const { pageIndex, accumulatedCount, accumulatedNewCount, responsesLimit } =
    options;
  const hasLimit = responsesLimit > 0;

  if (hasLimit && accumulatedCount >= responsesLimit) {
    return { syncedResponses: 0, newResponses: 0, hasMore: false };
  }

  const pageUrl =
    pageIndex === 0
      ? `${responsesUrl}&order=DATE`
      : `${responsesUrl}&page=${pageIndex}&order=DATE`;

  console.log(`📄 Страница ${pageIndex}: ${pageUrl}`);

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
  } catch (error) {
    console.error(`❌ Ошибка загрузки страницы ${pageIndex}:`, error);
    return { syncedResponses: 0, newResponses: 0, hasMore: false };
  }

  const hasResponses = await page
    .waitForSelector('div[data-qa="vacancy-real-responses"]', {
      timeout: HH_CONFIG.timeouts.selector,
    })
    .then(() => true)
    .catch(() => false);

  if (!hasResponses) {
    console.log(
      `⚠️ Контейнер с откликами не найден на странице ${pageIndex}`,
    );
    return { syncedResponses: 0, newResponses: 0, hasMore: false };
  }

  await scrollToLoadAllContent(page);

  const pageResponses = await page.$$eval(
    'div[data-qa="vacancy-real-responses"] [data-resume-hash]',
    (elements: Element[]) => {
      return elements.map((el) => {
        const link = el.querySelector('a[data-qa="serp-item__title"]');
        const url = link ? link.getAttribute("href") : "";
        const nameEl = el.querySelector(
          'span[data-qa="resume-serp__resume-fullname"]',
        );
        const name = nameEl ? nameEl.textContent?.trim() : "";

        let resumeId = "";
        if (url) {
          const fullUrl = new URL(url, "https://hh.ru").href;
          const match = fullUrl.match(/\/resume\/([a-f0-9]+)/);
          resumeId = match?.[1] ?? "";
        }

        let respondedAtStr = "";
        let respondedAtError = false;
        try {
          const dateSpans = el.querySelectorAll("span");
          for (const span of Array.from(dateSpans)) {
            const text = span.textContent?.trim() || "";
            if (text.includes("Откликнулся")) {
              const innerSpan = span.querySelector("span");
              respondedAtStr = innerSpan?.textContent?.trim() || "";
              break;
            }
          }
        } catch (error) {
          respondedAtError = true;
          respondedAtStr = `Ошибка парсинга даты: ${error instanceof Error ? error.message : String(error)}`;
        }

        return {
          name,
          url: url ? new URL(url, "https://hh.ru").href : "",
          resumeId,
          respondedAtStr,
          respondedAtError,
        };
      });
    },
  );

  if (pageResponses.length === 0) {
    console.log(`⚠️ Нет откликов на странице ${pageIndex}`);
    return { syncedResponses: 0, newResponses: 0, hasMore: false };
  }

  console.log(
    `✅ Страница ${pageIndex}: найдено ${pageResponses.length} откликов`,
  );

  let pageSaved = 0;
  let pageSkipped = 0;
  let totalSynced = accumulatedCount;

  for (const response of pageResponses) {
    if (hasLimit && totalSynced >= responsesLimit) {
      break;
    }

    if (response.respondedAtError) {
      console.error(
        `❌ Ошибка парсинга даты отклика для резюме ${response.resumeId}:`,
        response.respondedAtStr,
      );
    }

      if (response.url && response.resumeId) {
      const respondedAt = parseResponseDate(response.respondedAtStr || "");

      try {
        const result = await saveBasicResponse(
          vacancyIdForSave,
          response.resumeId,
          response.url,
          response.name,
          respondedAt,
          {
            profileUrl: response.url || null,
          },
        );

        if (!result.success) {
          console.error(
            `❌ Ошибка сохранения отклика ${response.name}:`,
            result.error,
          );
        } else if (result.data) {
          pageSaved++;
        } else {
          pageSkipped++;
        }

        totalSynced++;

        await onProgress?.(
          totalSynced,
          totalSynced,
          accumulatedNewCount + pageSaved,
          response.name,
        );
      } catch (error) {
        console.error(
          `❌ Ошибка сохранения отклика ${response.name}:`,
          error,
        );
      }
    }
  }

  console.log(
    `💾 Страница ${pageIndex}: сохранено ${pageSaved}, пропущено ${pageSkipped}`,
  );

  // Продолжаем на следующую страницу если:
  // 1. На текущей странице были отклики (pageResponses.length > 0)
  // 2. Не достигнут лимит
  // Это гарантирует, что мы не пропустим новые отклики на следующих страницах,
  // даже если на текущей странице все отклики уже были в базе.
  const hasMore =
    pageResponses.length > 0 && !(hasLimit && totalSynced >= responsesLimit);

  return {
    syncedResponses: totalSynced - accumulatedCount,
    newResponses: pageSaved,
    hasMore,
  };
}

async function collectAllArchivedResponses(
  page: Page,
  responsesUrl: string,
  vacancyIdForSave: string,
  organizationPlan?: "free" | "starter" | "pro" | "enterprise",
  onProgress?: (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<{ responses: ResponseWithId[]; newCount: number }> {
  const allResponses: ResponseWithId[] = [];
  let currentPage = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  // Получаем лимит из тарифного плана организации (воркспейс наследует план организации)
  const responsesLimit = organizationPlan
    ? getResponsesLimitByOrganizationPlan(organizationPlan)
    : 0;
  const hasLimit = responsesLimit > 0;

  if (hasLimit) {
    console.log(
      `⚙️ Установлен лимит для тарифа "${organizationPlan}": ${responsesLimit} откликов`,
    );
  }

  while (true) {
    // Проверяем лимит перед загрузкой следующей страницы
    if (hasLimit && allResponses.length >= responsesLimit) {
      console.log(
        `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем парсинг`,
      );
      break;
    }

    // Если лимит исчерпан и мы уже загрузили первую страницу, останавливаемся
    if (hasLimit && currentPage > 0 && allResponses.length >= responsesLimit) {
      console.log(
        `⏹️ Лимит исчерпан (${responsesLimit}), загружена только первая страница`,
      );
      break;
    }

    const pageUrl =
      currentPage === 0
        ? `${responsesUrl}&order=DATE`
        : `${responsesUrl}&page=${currentPage}&order=DATE`;

    console.log(`📄 Страница ${currentPage}: ${pageUrl}`);

    try {
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
    } catch (error) {
      console.error(`❌ Ошибка загрузки страницы ${currentPage}:`, error);
      break;
    }

    // Проверяем, есть ли отклики на странице
    const hasResponses = await page
      .waitForSelector('div[data-qa="vacancy-real-responses"]', {
        timeout: HH_CONFIG.timeouts.selector,
      })
      .then(() => true)
      .catch(() => false);

    if (!hasResponses) {
      console.log(
        `⚠️ Контейнер с откликами не найден на странице ${currentPage}`,
      );
      break;
    }

    await scrollToLoadAllContent(page);

    const pageResponses = await page.$$eval(
      'div[data-qa="vacancy-real-responses"] [data-resume-hash]',
      (elements: Element[]) => {
        return elements.map((el) => {
          const link = el.querySelector('a[data-qa="serp-item__title"]');
          const url = link ? link.getAttribute("href") : "";
          const nameEl = el.querySelector(
            'span[data-qa="resume-serp__resume-fullname"]',
          );
          const name = nameEl ? nameEl.textContent?.trim() : "";

          let resumeId = "";
          if (url) {
            const fullUrl = new URL(url, "https://hh.ru").href;
            const match = fullUrl.match(/\/resume\/([a-f0-9]+)/);
            resumeId = match?.[1] ?? "";
          }

          let respondedAtStr = "";
          let respondedAtError = false;
          try {
            const dateSpans = el.querySelectorAll("span");
            for (const span of Array.from(dateSpans)) {
              const text = span.textContent?.trim() || "";
              if (text.includes("Откликнулся")) {
                const innerSpan = span.querySelector("span");
                respondedAtStr = innerSpan?.textContent?.trim() || "";
                break;
              }
            }
          } catch (error) {
            respondedAtError = true;
            respondedAtStr = `Ошибка парсинга даты: ${error instanceof Error ? error.message : String(error)}`;
          }

          return {
            name,
            url: url ? new URL(url, "https://hh.ru").href : "",
            resumeId,
            respondedAtStr,
            respondedAtError,
          };
        });
      },
    );

    if (pageResponses.length === 0) {
      console.log(`⚠️ Нет откликов на странице ${currentPage}`);
      break;
    }

    console.log(
      `✅ Страница ${currentPage}: найдено ${pageResponses.length} откликов`,
    );

    let pageSaved = 0;
    let pageSkipped = 0;
    let pageErrors = 0;

    for (const response of pageResponses) {
      // Проверяем лимит перед обработкой каждого отклика
      if (hasLimit && allResponses.length >= responsesLimit) {
        console.log(
          `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем обработку страницы`,
        );
        break;
      }

      // Логируем ошибки парсинга даты из browser context
      if (response.respondedAtError) {
        console.error(
          `❌ Ошибка парсинга даты отклика для резюме ${response.resumeId}:`,
          response.respondedAtStr,
        );
      }

      if (response.url && response.resumeId) {
        const respondedAt = parseResponseDate(response.respondedAtStr || "");

        const responseWithId: ResponseWithId = {
          ...response,
          resumeId: response.resumeId,
          respondedAt,
        };

        allResponses.push(responseWithId);

        try {
          const result = await saveBasicResponse(
            vacancyIdForSave,
            response.resumeId,
            response.url,
            response.name,
            respondedAt,
            {
              profileUrl: response.url || null,
            },
          );

          if (!result.success) {
            pageErrors++;
            console.error(
              `❌ Ошибка сохранения отклика ${response.name}:`,
              result.error,
            );
          } else if (result.data) {
            pageSaved++;
          } else {
            pageSkipped++;
          }

          // Отправляем прогресс после обработки каждого отклика.
          // total = allResponses.length — текущее известное (возможно растущее) общее количество.
          await onProgress?.(
            allResponses.length,
            allResponses.length,
            totalSaved + pageSaved,
            response.name,
          );
        } catch (error) {
          pageErrors++;
          console.error(
            `❌ Ошибка сохранения отклика ${response.name}:`,
            error,
          );
        }
      } else {
        console.log(`⚠️ Не удалось получить resumeId для: ${response.name}`);
      }
    }

    totalSaved += pageSaved;
    totalSkipped += pageSkipped;

    console.log(
      `💾 Страница ${currentPage}: сохранено ${pageSaved}, пропущено ${pageSkipped}${pageErrors > 0 ? `, ошибок ${pageErrors}` : ""}`,
    );

    // Проверяем лимит после обработки страницы
    if (hasLimit && allResponses.length >= responsesLimit) {
      console.log(
        `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем парсинг`,
      );
      break;
    }

    // Если лимит установлен и мы загрузили первую страницу, останавливаемся
    // (не нужно ходить по всем страницам, если лимит уже исчерпан)
    if (
      hasLimit &&
      currentPage === 0 &&
      allResponses.length >= responsesLimit
    ) {
      console.log(
        `⏹️ Лимит исчерпан после первой страницы (${responsesLimit}), останавливаем парсинг`,
      );
      break;
    }

    // Если на странице не было ни одного нового отклика, останавливаем парсинг
    if (pageSaved === 0 && pageSkipped > 0) {
      console.log(
        `⏹️ Все отклики на странице ${currentPage} уже в базе, останавливаем парсинг`,
      );
      break;
    }

    // Для архивных вакансий парсим все страницы, так как там могут быть старые отклики
    // Останавливаемся только если на странице нет откликов вообще
    if (pageSaved === 0 && pageSkipped === 0) {
      console.log(
        `⏹️ На странице ${currentPage} нет откликов, останавливаем парсинг`,
      );
      break;
    }

    currentPage++;
  }

  console.log(
    `\n✅ Итого: собрано ${allResponses.length}, сохранено новых ${totalSaved}, пропущено (уже в базе) ${totalSkipped}`,
  );

  return { responses: allResponses, newCount: totalSaved };
}
