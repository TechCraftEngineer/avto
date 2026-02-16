import type { Page } from "puppeteer";

/**
 * Проверяет, отображается ли капча на странице
 */
export async function isCaptchaRequired(page: Page): Promise<boolean> {
  const captchaImg = await page.$(
    'img[data-qa="account-captcha-picture"], img[src*="/captcha/"]',
  );
  return captchaImg !== null;
}

/**
 * Получает картинку капчи в base64 (data URL) — скриншот элемента через Puppeteer,
 * гарантирует передачу клиенту без CORS
 */
export async function getCaptchaImageUrl(page: Page): Promise<string | null> {
  const captchaImg = await page.$(
    'img[data-qa="account-captcha-picture"], img[src*="/captcha/"]',
  );
  if (!captchaImg) return null;

  const buffer = await captchaImg.screenshot({ encoding: "base64" });
  if (!buffer || typeof buffer !== "string") return null;

  return `data:image/png;base64,${buffer}`;
}

/**
 * Вводит текст капчи в поле и отправляет форму
 */
export async function submitCaptcha(
  page: Page,
  captchaText: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const captchaInput = await page.$(
      'input[name="captchaText"], input[data-qa="account-captcha-input"]',
    );

    if (!captchaInput) {
      return {
        success: false,
        error: "Поле ввода капчи не найдено",
      };
    }

    await captchaInput.click();
    await captchaInput.type(captchaText, { delay: 100 });

    await new Promise((r) => setTimeout(r, 500));

    const submitButton = await page.$('button[type="submit"]:not([data-qa])');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    await new Promise((r) => setTimeout(r, 3000));

    const currentUrl = page.url();
    const stillOnLogin =
      currentUrl.includes("/account/login") || currentUrl.includes("/login");

    if (!stillOnLogin) {
      return { success: true };
    }

    const errorEl = await page.$(
      '.form-field-error, [data-qa="account-captcha-error"], .error-message',
    );
    if (errorEl) {
      const errorText = await errorEl.evaluate((el) => el.textContent);
      return {
        success: false,
        error: errorText?.includes("неверн")
          ? "Неверная капча. Попробуйте ещё раз."
          : errorText || "Ошибка при вводе капчи",
      };
    }

    const captchaStillVisible = await isCaptchaRequired(page);
    if (captchaStillVisible) {
      return {
        success: false,
        error: "Неверная капча. Попробуйте ещё раз.",
      };
    }

    return { success: false, error: "Неизвестная ошибка при вводе капчи" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
    return { success: false, error: msg };
  }
}
