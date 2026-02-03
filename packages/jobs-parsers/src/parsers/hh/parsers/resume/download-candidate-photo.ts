import axios from "axios";
import type { Page } from "puppeteer";
import { HH_CONFIG } from "../../core/config/config";

/**
 * Скачивает фото кандидата
 */
export async function downloadCandidatePhoto(
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
