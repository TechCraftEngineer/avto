import axios from "axios";
import * as cheerio from "cheerio";
import type { Page } from "puppeteer";
import { HH_CONFIG } from "../../core/config/config";

/**
 * Скачивает HTML-версию резюме и извлекает содержимое div.resume
 */
export async function downloadResumeHtml(
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

    const resumeContent = resumeDiv.html()?.trim();

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
