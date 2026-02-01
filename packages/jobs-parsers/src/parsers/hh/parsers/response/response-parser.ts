import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import type { Page } from "puppeteer";
import { z } from "zod";
import { HH_CONFIG } from "../../core/config/config";
import type { ProgressCallback, ResponseData } from "../../types";
import { parseResponseDate } from "../../utils/date-utils";
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
): Promise<{
  responses: ResponseData[];
  newCount: number;
  totalResponses: number;
}> {
  // Input validation
  const InputSchema = z.object({
    url: z.string().url("Некорректный URL"),
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

async function collectAndSaveResponses(
  page: Page,
  vacancyId: string,
  dbVacancyId: string,
  onProgress?: ProgressCallback,
): Promise<{ responses: ResponseData[]; newCount: number }> {
  const responses: ResponseData[] = [];
  let processedCount = 0;
  let newCount = 0;

  try {
    console.log(`📄 Переход на страницу откликов вакансии ${vacancyId}`);
    const responsesUrl = `${HH_CONFIG.urls.baseUrl}/employer/vacancies/${vacancyId}/responses`;
    await page.goto(responsesUrl, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    await page.waitForSelector('[data-qa="responses-list"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });

    // Собираем все отклики со всех страниц
    let hasNextPage = true;
    let pageNum = 0;

    while (hasNextPage && pageNum < 100) {
      // Ограничение на 100 страниц
      console.log(`📄 Парсим страницу ${pageNum + 1} откликов...`);

      // Собираем отклики с текущей страницы
      const pageResponses = await page.$$eval(
        '[data-qa="responses-list"] [data-qa*="response"]',
        (elements) => {
          return elements.map((element, index) => {
            const nameElement = element.querySelector(
              '[data-qa="response-candidate-name"]',
            );
            const name = nameElement?.textContent?.trim() || "";

            const resumeLink = element.querySelector(
              '[data-qa="response-candidate-link"]',
            ) as HTMLAnchorElement;
            const resumeUrl = resumeLink?.href || "";

            const statusElement = element.querySelector(
              '[data-qa*="response-status"]',
            );
            const status = statusElement?.textContent?.trim() || "";

            const dateElement = element.querySelector(
              '[data-qa="response-date"]',
            );
            const date = dateElement?.textContent?.trim() || "";

            const coverLetterElement = element.querySelector(
              '[data-qa="response-cover-letter"]',
            );
            const coverLetter = coverLetterElement?.textContent?.trim() || "";

            const resumeIdMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
            const resumeId = resumeIdMatch ? resumeIdMatch[1] : "";

            return {
              name,
              resumeUrl,
              resumeId,
              status,
              respondedAt: date,
              coverLetter,
              vacancyId: "", // Будет заполнено позже
              candidateId: "", // Будет заполнено позже
              externalId: `${vacancyId}_${resumeId}_${index}`, // Уникальный ID для каждого отклика
            };
          });
        },
      );

      // Сохраняем каждый отклик
      for (const response of pageResponses) {
        try {
          response.vacancyId = dbVacancyId;

          const saved = await saveBasicResponse(
            dbVacancyId,
            response.resumeId || "",
            response.resumeUrl,
            response.name,
            parseResponseDate(response.respondedAt),
          );

          const responseData: ResponseData = {
            ...response,
            url: response.resumeUrl,
          };

          if (saved.success && saved.data) {
            responses.push(responseData);
            newCount++;
          } else {
            responses.push(responseData); // Добавляем даже если не новый
          }

          processedCount++;
          if (onProgress && processedCount % 10 === 0) {
            onProgress({
              currentPage: pageNum + 1,
              totalSaved: newCount,
              totalSkipped: processedCount - newCount,
              message: `Обработано откликов: ${processedCount}`,
            });
          }
        } catch (error) {
          console.error(
            `❌ Ошибка сохранения отклика ${response.externalId}:`,
            error,
          );
        }
      }

      console.log(
        `📋 Откликов на странице ${pageNum + 1}: ${pageResponses.length}`,
      );

      // Проверяем, есть ли следующая страница
      const nextButton = await page.$('[data-qa="pager-next"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });
        pageNum++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`📊 Всего собрано откликов: ${responses.length}`);
  } catch (error) {
    console.error("❌ Ошибка при сборе откликов:", error);
  }

  return { responses, newCount };
}
