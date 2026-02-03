import type { HHContacts } from "@qbs-autonaim/jobs";
import { extractTelegramUsername } from "@qbs-autonaim/jobs/services/messaging";
import axios from "axios";
import type { Page } from "puppeteer";
import { HH_CONFIG } from "../../core/config/config";
import { parseRussianBirthDate } from "./date-parser";

interface ResumeExperienceItem {
  experience: string;
}

/**
 * Проверяет, является ли буфер PDF файлом по magic bytes
 */
function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

/**
 * Проверяет, является ли буфер текстовым файлом
 */
function isTextBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) return false;
  // Проверяем что это текст (UTF-8)
  try {
    const text = buffer.toString("utf-8");
    return text.length > 0 && !text.includes("\ufffd");
  } catch {
    return false;
  }
}

/**
 * Скачивает файл резюме с HH.ru (PDF или TXT)
 */
async function downloadResumeFile(
  page: Page,
  resumeUrl: string,
  fileType: "pdf" | "txt",
  candidateName?: string,
): Promise<Buffer | null> {
  try {
    console.log(`📥 Скачивание ${fileType.toUpperCase()} резюме...`);

    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";

    // Используем переданное имя кандидата или fallback
    const fileName = candidateName || "resume";

    const fileUrl = `https://hh.ru/resume_converter/${encodeURIComponent(fileName)}.${fileType}?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=${fileType}&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;

    console.log(`📄 URL: ${fileUrl}`);

    const cookies = await page.browserContext().cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await axios.get(fileUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Cookie: cookieString,
        Host: "hh.ru",
        Pragma: "no-cache",
        Referer: resumeUrl,
        "Sec-Ch-Ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": HH_CONFIG.userAgent,
      },
      responseType: "arraybuffer",
      timeout: 30000,
      maxRedirects: 5,
    });

    const buffer = Buffer.from(response.data);

    if (fileType === "pdf" && !isPdfBuffer(buffer)) {
      console.log("⚠️ Скачанный файл не является PDF");
      return null;
    }

    if (fileType === "txt" && !isTextBuffer(buffer)) {
      console.log("⚠️ Скачанный файл не является текстовым");
      return null;
    }

    console.log(
      `✅ ${fileType.toUpperCase()} файл скачан (${buffer.length} байт)`,
    );
    return buffer;
  } catch (error) {
    console.error(
      `❌ Ошибка скачивания ${fileType.toUpperCase()} файла:`,
      error,
    );
    return null;
  }
}

/**
 * Скачивает фото кандидата
 */
async function downloadCandidatePhoto(
  page: Page,
  resumeUrl: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    console.log("📸 Скачивание фото кандидата...");

    const photoSelector = '[data-qa="resume-photo"] img';
    const photoElement = await page.$(photoSelector);

    if (!photoElement) {
      console.log("⚠️ Фото кандидата не найдено");
      return null;
    }

    const photoUrl = await photoElement.evaluate((img) => img.src);

    if (
      !photoUrl ||
      photoUrl.includes("placeholder") ||
      photoUrl.includes("no-photo")
    ) {
      console.log("⚠️ Фото кандидата является placeholder");
      return null;
    }

    console.log(`📸 URL фото: ${photoUrl}`);

    const cookies = await page.browserContext().cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await axios.get(photoUrl, {
      headers: {
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Cookie: cookieString,
        Referer: resumeUrl,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": HH_CONFIG.userAgent,
      },
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 3,
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    console.log(`✅ Фото скачано (${buffer.length} байт, тип: ${contentType})`);
    return { buffer, mimeType: contentType };
  } catch (error) {
    console.error("❌ Ошибка скачивания фото кандидата:", error);
    return null;
  }
}

/**
 * Извлекает телефон из объекта contacts
 */
function extractPhone(contacts: HHContacts | null): string | null {
  if (!contacts?.phone || !Array.isArray(contacts.phone)) {
    return null;
  }

  const firstPhone = contacts.phone[0];
  return firstPhone?.formatted || firstPhone?.raw || null;
}

/**
 * Извлекает email из объекта contacts
 */
function extractEmail(contacts: HHContacts | null): string | null {
  if (!contacts?.email) {
    return null;
  }

  // email может быть строкой или массивом объектов
  if (typeof contacts.email === "string") {
    return contacts.email;
  }

  if (Array.isArray(contacts.email) && contacts.email.length > 0) {
    const firstEmail = contacts.email[0];
    return firstEmail?.email || null;
  }

  return null;
}

/**
 * Парсит полные данные резюме: опыт работы, контакты, дату рождения, PDF и фото
 */
export async function parseResumeData(
  page: Page,
  resumeUrl?: string,
  candidateName?: string,
): Promise<{
  experience: ResumeExperienceItem[];
  contacts: HHContacts | null;
  phone?: string;
  email?: string;
  birthDate?: Date | null;
  pdfBuffer?: Buffer;
  photoBuffer?: Buffer;
  photoMimeType?: string;
}> {
  const result = {
    experience: [] as ResumeExperienceItem[],
    contacts: null as HHContacts | null,
    phone: undefined as string | undefined,
    email: undefined as string | undefined,
    birthDate: undefined as Date | null | undefined,
    pdfBuffer: undefined as Buffer | undefined,
    photoBuffer: undefined as Buffer | undefined,
    photoMimeType: undefined as string | undefined,
  };

  try {
    // Если передан URL, переходим на страницу резюме
    if (resumeUrl) {
      console.log(`🌐 Переход на страницу резюме: ${resumeUrl}`);
      await page.goto(resumeUrl, {
        waitUntil: "domcontentloaded",
        timeout: HH_CONFIG.timeouts.navigation,
      });

      await page.waitForNetworkIdle({
        timeout: HH_CONFIG.timeouts.networkIdle,
      });
    }

    // Скачиваем PDF версию резюме
    if (resumeUrl) {
      result.pdfBuffer =
        (await downloadResumeFile(page, resumeUrl, "pdf", candidateName)) ||
        undefined;
    }

    // Скачиваем фото кандидата
    if (resumeUrl) {
      const photoData = await downloadCandidatePhoto(page, resumeUrl);
      if (photoData) {
        result.photoBuffer = photoData.buffer;
        result.photoMimeType = photoData.mimeType;
      }
    }

    // Парсим контакты - получаем полный объект contacts из HH.ru
    const contactsData = await page
      .evaluate(() => {
        // Ищем скрипт с данными резюме
        const scripts = Array.from(document.querySelectorAll("script"));
        for (const script of scripts) {
          const content = script.textContent || "";
          if (content.includes('"contacts"')) {
            try {
              // Пытаемся найти JSON с контактами
              const match = content.match(
                /resume["\s]*:[^{]*({[\s\S]*?})\s*[,}]/,
              );
              if (match && match[1]) {
                const resumeData = JSON.parse(match[1]);
                if (resumeData.contacts) {
                  return resumeData.contacts;
                }
              }
            } catch (_e) {
              // Игнорируем ошибки парсинга
            }
          }
        }
        return null;
      })
      .catch(() => null);

    result.contacts = contactsData;

    // Извлекаем телефон из contacts
    if (contactsData) {
      result.phone = extractPhone(contactsData) || undefined;
      result.email = extractEmail(contactsData) || undefined;

      if (result.phone) {
        console.log(`✅ Телефон извлечен: ${result.phone}`);
      }
      if (result.email) {
        console.log(`✅ Email извлечен: ${result.email}`);
      }
    }

    // Парсим дату рождения
    const birthDateString = await page
      .$eval('[data-qa="resume-personal-birthday"]', (element) => {
        return element.textContent?.trim();
      })
      .catch(() => undefined);

    if (birthDateString) {
      const parsedDate = parseRussianBirthDate(birthDateString);
      result.birthDate = parsedDate;
      if (parsedDate) {
        console.log(
          `✅ Дата рождения распарсена: ${birthDateString} -> ${parsedDate.toISOString()}`,
        );
      }
    }

    // Парсим опыт работы
    const experienceData = await page
      .$$eval(
        '[data-qa="resume-block-experience"] [data-qa="resume-block-item"]',
        (elements) => {
          return elements.map((element) => {
            const positionElement = element.querySelector(
              '[data-qa="resume-block-experience-position"]',
            );
            const position = positionElement?.textContent?.trim() || "";

            const companyElement = element.querySelector(
              '[data-qa="resume-block-experience-company"]',
            );
            const company = companyElement?.textContent?.trim() || "";

            const periodElement = element.querySelector(
              '[data-qa="resume-block-experience-dates"]',
            );
            const period = periodElement?.textContent?.trim() || "";

            const descriptionElement = element.querySelector(
              '[data-qa="resume-block-experience-description"]',
            );
            const description = descriptionElement?.textContent?.trim() || "";

            return {
              position,
              company,
              period,
              description,
            };
          });
        },
      )
      .catch(() => []);

    // Convert experience data to ResumeExperienceItem format
    result.experience = experienceData.map((exp) => ({
      experience: JSON.stringify(exp),
    }));

    console.log(
      `✅ Опыт работы распарсен: ${result.experience.length} записей`,
    );
  } catch (error) {
    console.error("❌ Ошибка парсинга опыта работы:", error);
  }

  return result;
}
