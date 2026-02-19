import type { Page } from "puppeteer";

/**
 * Скачивает текстовую версию резюме с HH.ru через Puppeteer
 * (с той же сессией и куками, что и основная страница)
 */
export async function downloadResumeText(
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

    const currentUrl = page.url();

    await page.goto(fileUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
      referer: resumeUrl,
    });

    const text = await page.evaluate(
      () => document.body?.innerText ?? document.body?.textContent ?? "",
    );

    // Возвращаем страницу на исходный URL
    await page.goto(currentUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!text || text.length === 0) {
      console.log("⚠️ Скачанный файл пустой");
      return null;
    }

    console.log(`✅ Текст резюме скачан (${text.length} символов)`);
    return text.trim();
  } catch (error) {
    console.error("❌ Ошибка скачивания текста резюме:", error);
    return null;
  }
}
