import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import { getResponsesLimitByOrganizationPlan } from "@qbs-autonaim/jobs-shared";
import type { Page } from "puppeteer";
import { z } from "zod";
import type { ProgressCallback, ResponseData } from "../../../types";
import { HH_CONFIG } from "../../core/config/config";
import { parseResponseDate } from "../../utils/date-utils";
import { scrollToLoadAllContent } from "../../utils/human-behavior";
import {
  filterResponsesNeedingDetails,
  parseResponseDetails,
} from "./response-utils";

export async function parseResponses(
  page: Page,
  url: string,
  externalVacancyId: string,
  vacancyId: string,
  onProgress?: ProgressCallback,
  organizationPlan?: "free" | "starter" | "pro" | "enterprise",
): Promise<{
  responses: ResponseData[];
  newCount: number;
  totalResponses: number;
}> {
  // Input validation
  const InputSchema = z.object({
    url: z.url({ error: "Некорректный URL" }),
    externalVacancyId: z
      .string()
      .min(1, "externalVacancyId не может быть пустым"),
    vacancyId: z.string().min(1, "vacancyId не может быть пустым"),
  });

  const validationResult = InputSchema.safeParse({
    url,
    externalVacancyId,
    vacancyId,
  });

  if (!validationResult.success) {
    console.error(
      "❌ Ошибка валидации входных параметров:",
      validationResult.error.issues,
    );
    throw new Error(
      `Некорректные входные параметры: ${validationResult.error.issues.map((i) => i.message).join(", ")}`,
    );
  }

  const urlObj = new URL(url, HH_CONFIG.urls.baseUrl);
  const urlVacancyId =
    urlObj.searchParams.get("vacancyId") || externalVacancyId;

  console.log(`🚀 Начинаем парсинг откликов для вакансии ${urlVacancyId}`);

  console.log("\n📋 ЭТАП 1: Сбор откликов и сохранение в базу...");
  const { responses: allResponses, newCount } = await collectAndSaveResponses(
    page,
    urlVacancyId,
    vacancyId,
    onProgress,
    organizationPlan,
  );

  if (allResponses.length === 0) {
    console.log("⚠️ Не найдено откликов для обработки");
    return { responses: [], newCount: 0, totalResponses: 0 };
  }

  console.log(`✅ Всего обработано откликов: ${allResponses.length}`);

  console.log("\n🔍 ЭТАП 2: Поиск откликов без детальной информации...");
  const responsesNeedingDetails = await filterResponsesNeedingDetails(
    allResponses,
    vacancyId,
  );

  console.log(
    `✅ Откликов требующих парсинга деталей: ${responsesNeedingDetails.length}`,
  );

  if (responsesNeedingDetails.length === 0) {
    console.log("ℹ️ Все отклики уже имеют детальную информацию");
    return {
      responses: allResponses,
      newCount,
      totalResponses: allResponses.length,
    };
  }

  console.log("\n📊 ЭТАП 3: Парсинг детальной информации резюме...");
  await parseResponseDetails(page, responsesNeedingDetails, vacancyId);

  console.log(
    `\n🎉 Парсинг завершен! Обработано откликов: ${responsesNeedingDetails.length}`,
  );

  return {
    responses: allResponses,
    newCount,
    totalResponses: allResponses.length,
  };
}

interface ParsedResponse {
  name: string;
  url: string;
  resumeId: string;
  respondedAtStr: string;
  respondedAtError: boolean;
}

async function collectAndSaveResponses(
  page: Page,
  vacancyId: string,
  dbVacancyId: string,
  onProgress?: ProgressCallback,
  organizationPlan?: "free" | "starter" | "pro" | "enterprise",
): Promise<{ responses: ResponseData[]; newCount: number }> {
  const responses: ResponseData[] = [];
  let totalSaved = 0;

  // Получаем лимит из тарифного плана организации
  const responsesLimit = organizationPlan
    ? getResponsesLimitByOrganizationPlan(organizationPlan)
    : 0;
  const hasLimit = responsesLimit > 0;

  if (hasLimit) {
    console.log(
      `⚙️ Установлен лимит для тарифа "${organizationPlan}": ${responsesLimit} откликов`,
    );
  }

  const responsesUrl = `${HH_CONFIG.urls.baseUrl}/employer/vacancyresponses?vacancyId=${vacancyId}`;

  try {
    let currentPage = 0;

    while (currentPage < 100) {
      // Проверяем лимит перед загрузкой следующей страницы
      if (hasLimit && responses.length >= responsesLimit) {
        console.log(
          `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем парсинг`,
        );
        break;
      }

      if (hasLimit && currentPage > 0 && responses.length >= responsesLimit) {
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
        await page.goto(pageUrl, {
          waitUntil: "networkidle2",
          timeout: HH_CONFIG.timeouts.navigation,
        });
      } catch (error) {
        console.error(`❌ Ошибка загрузки страницы ${currentPage}:`, error);
        break;
      }

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

      for (const response of pageResponses as ParsedResponse[]) {
        if (hasLimit && responses.length >= responsesLimit) {
          console.log(
            `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем обработку страницы`,
          );
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
          const responseData: ResponseData = {
            name: response.name,
            url: response.url,
            resumeUrl: response.url,
            resumeId: response.resumeId,
            externalId: `${dbVacancyId}_${response.resumeId}`,
            respondedAt: respondedAt?.toISOString(),
            vacancyId: dbVacancyId,
          };

          try {
            const result = await saveBasicResponse(
              dbVacancyId,
              response.resumeId,
              response.url,
              response.name,
              respondedAt ?? new Date(),
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

            responses.push(responseData);

            await onProgress?.({
              currentPage: currentPage + 1,
              totalSaved: totalSaved + pageSaved,
              totalSkipped: pageSkipped,
              message: `Обработано откликов: ${responses.length}`,
            });
          } catch (error) {
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

      console.log(
        `💾 Страница ${currentPage}: сохранено ${pageSaved}, пропущено ${pageSkipped}`,
      );

      if (hasLimit && responses.length >= responsesLimit) {
        console.log(
          `⏹️ Достигнут лимит загрузки откликов (${responsesLimit}), останавливаем парсинг`,
        );
        break;
      }

      if (hasLimit && currentPage === 0 && responses.length >= responsesLimit) {
        console.log(
          `⏹️ Лимит исчерпан после первой страницы (${responsesLimit}), останавливаем парсинг`,
        );
        break;
      }

      if (pageSaved === 0 && pageSkipped > 0) {
        console.log(
          `⏹️ Все отклики на странице ${currentPage} уже в базе, останавливаем парсинг`,
        );
        break;
      }

      if (pageSaved === 0 && pageSkipped === 0) {
        console.log(
          `⏹️ На странице ${currentPage} нет откликов, останавливаем парсинг`,
        );
        break;
      }

      currentPage++;
    }

    console.log(
      `\n✅ Итого: собрано ${responses.length}, сохранено новых ${totalSaved}`,
    );
  } catch (error) {
    console.error("❌ Ошибка при сборе откликов:", error);
  }

  return { responses, newCount: totalSaved };
}
