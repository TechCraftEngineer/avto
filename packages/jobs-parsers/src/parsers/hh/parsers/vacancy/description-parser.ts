import puppeteer from "puppeteer";
import { closeBrowserSafely } from "../../core/browser/browser-utils";
import { HH_CONFIG } from "../../core/config/config";
import { humanBrowse, humanDelay } from "../../utils/human-behavior";

/**
 * Парсит описание вакансии с HH.ru по URL
 */
export async function parseVacancyDescription(url: string): Promise<string> {
  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();
    await page.setUserAgent({
      userAgent: HH_CONFIG.userAgent,
    });

    console.log(`📄 Переход на страницу вакансии: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    // Пауза после загрузки
    await humanDelay(1000, 2500);

    await page.waitForSelector(".vacancy-section", {
      timeout: HH_CONFIG.timeouts.selector,
    });

    // Имитируем чтение описания вакансии
    await humanBrowse(page);

    const htmlContent = await page.$eval(
      ".vacancy-section",
      (el) => (el as HTMLElement).innerHTML,
    );

    return htmlContent.trim();
  } catch (error) {
    console.error("⚠️ Не удалось получить описание вакансии:", error);
    return "";
  } finally {
    await closeBrowserSafely(browser);
  }
}
