import type { Page } from "puppeteer";
import {
  hasDetailedInfo,
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "../../../services/response";
import type { ResponseData } from "../../types";
import { HH_CONFIG } from "../../core/config/config";
import { humanScroll } from "../../utils/human-behavior";
import { parseResumeExperience } from "../resume/resume-parser";
import { parseResponseDate } from "../../utils/date-utils";

interface ResponseWithId extends ResponseData {
  resumeId: string;
  respondedAt?: Date;
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
    try {
      const needsDetails = !(await hasDetailedInfo(response.resumeId, vacancyId));
      if (needsDetails) {
        responsesNeedingDetails.push({
          ...response,
          resumeId: response.resumeId,
          respondedAt: parseResponseDate(response.respondedAt || ''),
        });
      }
    } catch (error) {
      console.error(`❌ Ошибка проверки деталей для отклика ${response.externalId}:`, error);
    }
  }

  return responsesNeedingDetails;
}

/**
 * Парсит детальную информацию резюме для массива откликов
 */
export async function parseResponseDetails(
  page: Page,
  responses: ResponseWithId[],
  vacancyId: string,
): Promise<void> {
  console.log(`🔍 Начинаем парсинг деталей для ${responses.length} откликов`);

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];

    try {
      console.log(`📄 Парсим детали для отклика ${i + 1}/${responses.length}: ${response.name}`);

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

      // Парсим детальную информацию
      const details = await extractResumeDetails(page);

      // Парсим опыт работы
      const experience = await parseResumeExperience(page);

      // Обновляем информацию в базе
      await updateResponseDetails(
        response.resumeId,
        vacancyId,
        {
          ...details,
          experience,
          respondedAt: response.respondedAt,
        },
      );

      console.log(`✅ Детали сохранены для: ${response.name}`);
    } catch (error) {
      console.error(`❌ Ошибка парсинга деталей для ${response.externalId}:`, error);
    }

    // Задержка между обработкой откликов
    const delay = Math.random() * 3000 + 2000; // 2-5 секунд
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Извлекает детальную информацию из резюме
 */
async function extractResumeDetails(page: Page): Promise<{
  email?: string;
  phone?: string;
  telegram?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  photoUrl?: string;
  resumePdfUrl?: string;
}> {
  const details: any = {};

  try {
    // Извлекаем контакты
    const contacts = await page.$eval('[data-qa="resume-contacts"]', (element) => {
      const emailElement = element.querySelector('[data-qa="resume-contact-email"]');
      const phoneElement = element.querySelector('[data-qa="resume-contact-phone"]');
      const telegramElement = element.querySelector('[data-qa*="telegram"]');
      const linkedinElement = element.querySelector('[data-qa*="linkedin"]');
      const githubElement = element.querySelector('[data-qa*="github"]');
      const portfolioElement = element.querySelector('[data-qa*="portfolio"]');

      return {
        email: emailElement?.textContent?.trim(),
        phone: phoneElement?.textContent?.trim(),
        telegram: telegramElement?.textContent?.trim(),
        linkedin: linkedinElement?.textContent?.trim(),
        github: githubElement?.textContent?.trim(),
        portfolio: portfolioElement?.textContent?.trim(),
      };
    });

    Object.assign(details, contacts);

    // Извлекаем фото кандидата
    const photoElement = await page.$('[data-qa="resume-photo"] img');
    if (photoElement) {
      const photoUrl = await photoElement.evaluate((img) => img.src);
      if (photoUrl) {
        details.photoUrl = photoUrl;
        // Скачиваем и загружаем фото
        await uploadCandidatePhoto(details.resumeId, photoUrl);
      }
    }

    // Ищем ссылку на PDF версию резюме
    const pdfLink = await page.$('[data-qa="resume-pdf-link"]');
    if (pdfLink) {
      const pdfUrl = await pdfLink.evaluate((a) => a.href);
      if (pdfUrl) {
        details.resumePdfUrl = pdfUrl;
        // Скачиваем и загружаем PDF
        await uploadResumePdf(details.resumeId, pdfUrl);
      }
    }
  } catch (error) {
    console.error("❌ Ошибка извлечения деталей резюме:", error);
  }

  return details;
}