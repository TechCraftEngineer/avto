import type { Browser } from "puppeteer";

/**
 * Безопасно закрывает браузер Puppeteer с механизмом повторных попыток
 *
 * Особенности:
 * - Механизм повторных попыток при неудаче
 * - Правильное закрытие всех страниц перед закрытием браузера
 * - Принудительное завершение процесса при persistent ошибках
 * - Улучшенная обработка ошибок для Windows (EBUSY issues)
 *
 * @param browser - Экземпляр Puppeteer Browser для закрытия
 * @param maxRetries - Максимальное количество попыток закрытия (по умолчанию 3)
 */
export async function closeBrowserSafely(
  browser: Browser,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Close all pages first
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close().catch(() => {})));

      // Close browser
      await browser.close();
      console.log("✅ Браузер успешно закрыт");
      return;
    } catch (error) {
      console.warn(
        `⚠️ Попытка ${attempt}/${maxRetries} закрытия браузера не удалась:`,
        error,
      );

      if (attempt === maxRetries) {
        console.error("❌ Не удалось закрыть браузер после всех попыток");
        // Force kill the browser process if possible
        try {
          if (browser.process()) {
            browser.process()!.kill("SIGKILL");
          }
        } catch (killError) {
          console.error(
            "❌ Не удалось принудительно завершить процесс браузера:",
            killError,
          );
        }
      } else {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}
