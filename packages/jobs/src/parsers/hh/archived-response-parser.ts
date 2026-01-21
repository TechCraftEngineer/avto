import type { Page } from "puppeteer";
import {
  hasDetailedInfo,
  saveBasicResponse,
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "../../services/response";
import type { ResponseData } from "../types";
import { HH_CONFIG } from "./config";
import { humanScroll } from "./human-behavior";
import { parseResumeExperience } from "./resume-parser";

interface ResponseWithId extends ResponseData {
  resumeId: string;
  respondedAt?: Date;
}

export async function parseArchivedVacancyResponses(
  page: Page,
  vacancyId: string,
  externalId?: string | null,
  url?: string | null,
): Promise<{ syncedResponses: number; newResponses: number }> {
  console.log(`🚀 Начинаем парсинг откликов для архивной вакансии ${vacancyId}`);

  // Определяем URL для откликов
  let responsesUrl: string;

  if (url) {
    // Если есть прямая ссылка, используем её
    responsesUrl = url;
  } else if (externalId) {
    // Строим URL из externalId
    responsesUrl = `${HH_CONFIG.urls.baseUrl}/employer/vacancyresponses?vacancyId=${externalId}`;
  } else {
    throw new Error("Не указан externalId или URL для вакансии");
  }

  console.log(`📄 URL откликов: ${responsesUrl}`);

  console.log("\n📋 ЭТАП 1: Сбор всех откликов и сохранение в базу...");
  const { responses: allResponses, newCount } = await collectAllArchivedResponses(
    page,
    responsesUrl,
    vacancyId,
  );

  if (allResponses.length === 0) {
    console.log("⚠️ Не найдено откликов для обработки");
    return { syncedResponses: 0, newResponses: 0 };
  }

  console.log(`✅ Всего обработано откликов: ${allResponses.length} (новых: ${newCount})`);

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
    return { syncedResponses: allResponses.length, newResponses: newCount };
  }

  console.log("\n📊 ЭТАП 3: Парсинг детальной информации резюме...");
  await parseResponseDetails(page, responsesNeedingDetails, vacancyId);

  console.log(
    `\n🎉 Парсинг завершен! Обработано откликов: ${responsesNeedingDetails.length}`,
  );

  return { syncedResponses: allResponses.length, newResponses: newCount };
}

function parseResponseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  const currentYear = new Date().getFullYear();
  const months: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  };

  const match = dateStr.match(/(\d+)\s+(\S+)/);
  if (match) {
    const day = Number.parseInt(match[1] || "1", 10);
    const monthName = match[2]?.toLowerCase() || "";
    const month = months[monthName];

    if (month !== undefined) {
      return new Date(currentYear, month, day);
    }
  }

  return undefined;
}

async function collectAllArchivedResponses(
  page: Page,
  responsesUrl: string,
  vacancyIdForSave: string,
): Promise<{ responses: ResponseWithId[]; newCount: number }> {
  const allResponses: ResponseWithId[] = [];
  let currentPage = 0;
  let totalSaved = 0;
  let totalSkipped = 0;

  while (true) {
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

    await humanScroll(page);

    const pageResponses = await page.$$eval(
      'div[data-qa="vacancy-real-responses"] [data-resume-id]',
      (elements: Element[]) => {
        return elements.map((el) => {
          const link = el.querySelector('a[data-qa*="resume-serp__resume-fullname"]');
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
            console.warn("Не удалось распарсить дату respondedAt:", error);
          }

          return {
            name,
            url: url ? new URL(url, "https://hh.ru").href : "",
            resumeId,
            respondedAtStr,
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

async function filterResponsesNeedingDetails(
  responses: ResponseWithId[],
  vacancyId: string,
): Promise<ResponseWithId[]> {
  const responsesNeedingDetails: ResponseWithId[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;

    try {
      const result = await hasDetailedInfo(vacancyId, response.resumeId);

      if (!result.success) {
        console.error(
          `❌ Ошибка проверки деталей для ${response.name}:`,
          result.error,
        );
        responsesNeedingDetails.push(response);
        continue;
      }

      if (!result.data) {
        responsesNeedingDetails.push(response);
        console.log(
          `Требуется парсинг ${i + 1}/${responses.length}: ${response.name}`,
        );
      } else {
        console.log(
          `✅ Детали есть ${i + 1}/${responses.length}: ${response.name}`,
        );
      }
    } catch (error) {
      console.error(`❌ Ошибка проверки деталей для ${response.name}:`, error);
      responsesNeedingDetails.push(response);
    }
  }

  return responsesNeedingDetails;
}

async function parseResponseDetails(
  page: Page,
  responses: ResponseWithId[],
  vacancyId: string,
): Promise<void> {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;

    try {
      console.log(
        `\n📊 Парсинг резюме ${i + 1}/${responses.length}: ${response.name}`,
      );

      const experienceData = await parseResumeExperience(
        page,
        response.url,
        response.name,
      );
      let resumePdfFileId: string | null = null;
      if (experienceData.pdfBuffer) {
        const uploadResult = await uploadResumePdf(
          experienceData.pdfBuffer,
          response.resumeId,
        );
        if (uploadResult.success) {
          resumePdfFileId = uploadResult.data;
        }
      }

      let photoFileId: string | null = null;

      if (experienceData.photoBuffer && experienceData.photoMimeType) {
        console.log(
          `📸 Загрузка фото кандидата в S3 (размер: ${experienceData.photoBuffer.length} байт, тип: ${experienceData.photoMimeType})`,
        );
        const uploadResult = await uploadCandidatePhoto(
          experienceData.photoBuffer,
          response.resumeId,
          experienceData.photoMimeType,
        );
        if (uploadResult.success) {
          photoFileId = uploadResult.data;
          console.log(`✅ Фото загружено в S3, file ID: ${photoFileId}`);
        } else {
          console.log(`⚠️ Ошибка загрузки фото в S3: ${uploadResult.error}`);
        }
      } else {
        console.log(
          `⚠️ Фото не будет загружено: photoBuffer=${!!experienceData.photoBuffer}, photoMimeType=${!!experienceData.photoMimeType}`,
        );
      }

      const updateResult = await updateResponseDetails({
        vacancyId,
        resumeId: response.resumeId,
        resumeUrl: response.url,
        candidateName: response.name,
        experience: experienceData.experience,
        contacts: experienceData.contacts,
        phone: experienceData.phone,
        resumePdfFileId,
        photoFileId,
      });

      if (!updateResult.success) {
        throw new Error(
          `Failed to update response details: ${updateResult.error}`,
        );
      }

      successCount++;
      console.log(`✅ Резюме ${i + 1}/${responses.length} обработано успешно`);
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Ошибка парсинга резюме ${response.name}:`,
        errorMessage,
      );

      console.log(`⏭️ Переход к следующему резюме...`);
    }
  }

  console.log(
    `\n📊 Итого парсинг резюме: успешно ${successCount}, ошибок ${errorCount}`,
  );
}