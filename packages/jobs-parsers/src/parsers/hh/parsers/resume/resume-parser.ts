import { ResumeStructurerAgent } from "@qbs-autonaim/ai";
import type { HHContacts } from "@qbs-autonaim/jobs";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import type { WorkExperience } from "@qbs-autonaim/validators";
import axios from "axios";
import * as cheerio from "cheerio";
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
 * Скачивает HTML-версию резюме и извлекает содержимое div.resume
 */
async function downloadResumeHtml(
  page: Page,
  resumeUrl: string,
  candidateName?: string,
): Promise<string | null> {
  try {
    console.log("📥 Скачивание HTML-версии резюме...");

    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";
    const fileName = candidateName || "resume";

    const fileUrl = `https://hh.ru/resume_converter/${encodeURIComponent(fileName)}.txt?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=txt&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;

    console.log(`📄 URL: ${fileUrl}`);

    const cookies = await page.browserContext().cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await axios.get(fileUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
      responseType: "text",
      timeout: 30000,
      maxRedirects: 5,
    });

    const html = response.data;

    if (!html || typeof html !== "string" || html.length === 0) {
      console.log("⚠️ Скачанный HTML пустой");
      return null;
    }

    // Парсим HTML и извлекаем содержимое div.resume
    const $ = cheerio.load(html);
    const resumeDiv = $('div[class="resume"]');

    if (resumeDiv.length === 0) {
      console.log("⚠️ Элемент div.resume не найден в HTML");
      return null;
    }

    const resumeContent = resumeDiv.text().trim();

    if (!resumeContent || resumeContent.length === 0) {
      console.log("⚠️ Содержимое div.resume пустое");
      return null;
    }

    console.log(
      `✅ HTML резюме скачан и распарсен (${resumeContent.length} символов)`,
    );
    return resumeContent;
  } catch (error) {
    console.error("❌ Ошибка скачивания HTML резюме:", error);
    return null;
  }
}

/**
 * Скачивает текстовую версию резюме с HH.ru
 */
async function downloadResumeText(
  page: Page,
  resumeUrl: string,
  candidateName?: string,
): Promise<string | null> {
  try {
    console.log("📥 Скачивание текстовой версии резюме...");

    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";
    const fileName = candidateName || "resume";

    const fileUrl = `https://hh.ru/resume_converter/${encodeURIComponent(fileName)}.txt?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=txt&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;

    console.log(`📄 URL: ${fileUrl}`);

    const cookies = await page.browserContext().cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await axios.get(fileUrl, {
      headers: {
        Accept: "text/plain,text/html,*/*",
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
      responseType: "text",
      timeout: 30000,
      maxRedirects: 5,
    });

    const text = response.data;

    if (!text || typeof text !== "string" || text.length === 0) {
      console.log("⚠️ Скачанный файл пустой");
      return null;
    }

    console.log(`✅ Текст резюме скачан (${text.length} символов)`);
    return text;
  } catch (error) {
    console.error("❌ Ошибка скачивания текста резюме:", error);
    return null;
  }
}

/**
 * Скачивает PDF версию резюме с HH.ru
 */
async function downloadResumePdf(
  page: Page,
  resumeUrl: string,
  candidateName?: string,
): Promise<Buffer | null> {
  try {
    console.log("📥 Скачивание PDF резюме...");

    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";
    const fileName = candidateName || "resume";

    const fileUrl = `https://hh.ru/resume_converter/${encodeURIComponent(fileName)}.pdf?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=pdf&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;

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

    if (!isPdfBuffer(buffer)) {
      console.log("⚠️ Скачанный файл не является PDF");
      return null;
    }

    console.log(`✅ PDF файл скачан (${buffer.length} байт)`);
    return buffer;
  } catch (error) {
    console.error("❌ Ошибка скачивания PDF файла:", error);
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
 * Парсит данные резюме через LLM из текстовой версии
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
    if (!resumeUrl) {
      console.log("⚠️ URL резюме не передан");
      return result;
    }

    console.log(`🌐 Переход на страницу резюме: ${resumeUrl}`);
    await page.goto(resumeUrl, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Сначала пробуем скачать HTML-версию с div.resume
    let resumeText = await downloadResumeHtml(page, resumeUrl, candidateName);

    // Если HTML не удалось получить, пробуем текстовую версию
    if (!resumeText) {
      console.log("⚠️ HTML-версия недоступна, пробуем текстовую версию...");
      resumeText = await downloadResumeText(page, resumeUrl, candidateName);
    }

    if (!resumeText) {
      console.log("⚠️ Не удалось скачать резюме ни в одном формате");
      return result;
    }

    // Используем LLM для извлечения структурированных данных
    console.log("🤖 Извлечение данных через LLM...");

    const structurer = new ResumeStructurerAgent({
      model: getAIModel(),
    });

    const structuredResult = await structurer.execute(
      { rawText: resumeText },
      {},
    );

    if (!structuredResult.success || !structuredResult.data) {
      console.log("⚠️ LLM не смог извлечь данные из резюме");
      return result;
    }

    const structuredData = structuredResult.data;
    console.log("✅ Данные извлечены через LLM");

    // Преобразуем данные в нужный формат
    if (structuredData.personalInfo) {
      const { email, phone, telegram, whatsapp } = structuredData.personalInfo;

      // Формируем contacts в формате HH
      const contacts: HHContacts = {};

      if (phone) {
        contacts.phone = [{ formatted: phone }];
        result.phone = phone;
        console.log(`✅ Найден телефон: ${phone}`);
      }

      if (email) {
        contacts.email = [{ email }];
        result.email = email;
        console.log(`✅ Найден email: ${email}`);
      }

      // Добавляем Telegram и WhatsApp в preferred контакты
      const preferredContacts: Array<{
        type: { id: string; name: string };
        value?: string;
      }> = [];

      if (telegram) {
        preferredContacts.push({
          type: { id: "telegram", name: "Telegram" },
          value: telegram.startsWith("@") ? telegram.slice(1) : telegram,
        });
        console.log(`✅ Найден Telegram: ${telegram}`);
      }

      if (whatsapp) {
        preferredContacts.push({
          type: { id: "whatsapp", name: "WhatsApp" },
          value: whatsapp,
        });
        console.log(`✅ Найден WhatsApp: ${whatsapp}`);
      }

      if (preferredContacts.length > 0) {
        contacts.preferred = preferredContacts;
      }

      if (Object.keys(contacts).length > 0) {
        result.contacts = contacts;
      }
    }

    // Преобразуем опыт работы
    if (structuredData.experience && structuredData.experience.length > 0) {
      result.experience = structuredData.experience.map(
        (exp: WorkExperience) => ({
          experience: JSON.stringify({
            company: exp.company,
            position: exp.position,
            period: `${exp.startDate} - ${exp.endDate || "настоящее время"}`,
            description: exp.description,
          }),
        }),
      );
      console.log(`✅ Опыт работы: ${result.experience.length} записей`);
    }

    // Скачиваем PDF версию резюме
    result.pdfBuffer =
      (await downloadResumePdf(page, resumeUrl, candidateName)) || undefined;

    // Скачиваем фото кандидата
    const photoData = await downloadCandidatePhoto(page, resumeUrl);
    if (photoData) {
      result.photoBuffer = photoData.buffer;
      result.photoMimeType = photoData.mimeType;
    }

    // Пытаемся извлечь дату рождения из DOM (если есть на странице)
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
          `✅ Дата рождения: ${birthDateString} -> ${parsedDate.toISOString()}`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Ошибка парсинга резюме:", error);
  }

  return result;
}
