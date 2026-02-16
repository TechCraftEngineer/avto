import type { Page } from "puppeteer";
import { HH_CONFIG } from "../config/config";

/**
 * Вспомогательная функция для логирования
 */
function logInfo(message: string): void {
  console.log(message);
}

function logError(message: string): void {
  console.error(message);
}

/**
 * Результат проверки необходимости 2FA
 */
export interface TwoFactorCheckResult {
  /** Требуется ли двухфакторная аутентификация */
  requiresTwoFactor: boolean;
  /** Сообщение для пользователя */
  message?: string;
  /** Тип 2FA (email или phone) */
  twoFactorType?: "email" | "phone";
}

/**
 * Результат аутентификации с 2FA
 */
export interface TwoFactorAuthResult {
  /** Успешна ли авторизация */
  success: boolean;
  /** Ошибка, если авторизация не удалась */
  error?: string;
}

/**
 * Проверяет, требуется ли двухфакторная аутентификация
 * @param page - Puppeteer страница
 */
export async function checkTwoFactorRequired(
  page: Page,
): Promise<TwoFactorCheckResult> {
  try {
    // Проверяем наличие элемента для ввода кода
    const codeInput = await page.$('div[data-qa="account-login-code-input"]');

    if (codeInput) {
      return {
        requiresTwoFactor: true,
        message: "Требуется подтверждение входа по коду",
        twoFactorType: "email",
      };
    }

    // Проверяем наличие капчи
    const captchaElement = await page.$(
      'div[data-qa="account-login-captcha"], .captcha-container, img[src*="captcha"]',
    );

    if (captchaElement) {
      return {
        requiresTwoFactor: true,
        message: "Требуется прохождение капчи",
        twoFactorType: undefined,
      };
    }

    return {
      requiresTwoFactor: false,
    };
  } catch (error) {
    logError("Ошибка при проверке 2FA:");
    console.error(error);
    return {
      requiresTwoFactor: false,
    };
  }
}

/**
 * Инициирует вход с использованием кода подтверждения
 * Вместо ввода пароля нажимает на кнопку для перехода к аутентификации по коду
 * @param page - Puppeteer страница
 * @param email - Email пользователя
 */
export async function initiateCodeAuth(
  page: Page,
  email: string,
): Promise<boolean> {
  try {
    logInfo("🔍 Поиск поля email...");

    // Ожидаем поле ввода email
    await page.waitForSelector('input[type="text"][name="username"]', {
      visible: false,
      timeout: 15000,
    });

    logInfo("✍️ Ввод email...");

    // Очищаем поле и вводим email
    await page.click('input[type="text"][name="username"]', {
      clickCount: 3,
    });
    await page.keyboard.press("Backspace");
    await new Promise((r) => setTimeout(r, Math.random() * 500 + 200));
    await page.type('input[type="text"][name="username"]', email, {
      delay: 100,
    });

    // Небольшая пауза перед нажатием на кнопку
    await new Promise((r) => setTimeout(r, Math.random() * 500 + 500));

    // Нажимаем на кнопку "Получить код" вместо кнопки входа с паролем
    // Кнопка с data-qa="account-login-submit" отправляет код на email/phone
    logInfo("📨 Нажатие на кнопку 'Получить код'...");

    const submitButton = await page.$('button[data-qa="account-login-submit"]');

    if (!submitButton) {
      logInfo(
        "⚠️ Кнопка account-login-submit не найдена, пробуем другой селектор...",
      );
      // Пробуем альтернативные селекторы
      const alternativeButton = await page.$(
        'button[data-qa="login-form-submit"], button[type="submit"]',
      );

      if (!alternativeButton) {
        throw new Error("Кнопка отправки не найдена");
      }

      await alternativeButton.click();
    } else {
      await submitButton.click();
    }

    // Ждем появления поля для ввода кода
    logInfo("⏳ Ожидание поля для ввода кода...");
    await new Promise((r) => setTimeout(r, 2000));

    // Проверяем, появилось ли поле для ввода кода
    const codeInputDiv = await page.$(
      'div[data-qa="account-login-code-input"]',
    );

    if (codeInputDiv) {
      logInfo("✅ Переход к вводу кода выполнен");
      return true;
    }

    // Если код не запрошен, возможно требуется пароль
    const passwordInput = await page.$(
      'input[type="password"][name="password"]',
    );

    if (passwordInput) {
      logInfo("⚠️ Требуется пароль вместо кода");
      return false;
    }

    logInfo("⚠️ Не удалось определить следующий шаг авторизации");
    return false;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    logError(`❌ Ошибка при инициации аутентификации по коду: ${message}`);
    return false;
  }
}

/**
 * Отправляет код подтверждения на hh.ru
 * @param page - Puppeteer страница
 * @param code - 4-значный код подтверждения
 */
export async function submitVerificationCode(
  page: Page,
  code: string,
): Promise<TwoFactorAuthResult> {
  try {
    logInfo("📝 Ввод кода подтверждения...");

    // Поле для ввода кода имеет id "magritte-pincode-input-field"
    // Оно находится внутри div[data-qa="account-login-code-input"]

    // Ищем все поля ввода внутри контейнера для кода
    const codeInputContainer = await page.$(
      'div[data-qa="account-login-code-input"]',
    );

    if (!codeInputContainer) {
      return {
        success: false,
        error: "Контейнер для ввода кода не найден",
      };
    }

    // Ищем поля ввода внутри контейнера
    const inputFields = await codeInputContainer.$$("input");

    if (inputFields.length === 0) {
      // Пробуем найти поле по id
      const pincodeInput = await page.$("#magritte-pincode-input-field");

      if (!pincodeInput) {
        return {
          success: false,
          error: "Поле для ввода кода не найдено",
        };
      }

      await pincodeInput.type(code, { delay: 100 });
    } else {
      // Вводим код в каждое поле (4 поля для 4-значного кода)
      const codeDigits = code.split("");

      for (
        let i = 0;
        i < Math.min(codeDigits.length, inputFields.length);
        i++
      ) {
        const digit = codeDigits[i];
        if (digit !== undefined) {
          await inputFields[i]!.type(digit, { delay: 100 });
        }
      }
    }

    // Небольшая пауза перед отправкой
    await new Promise((r) => setTimeout(r, 500));

    // Нажимаем кнопку подтверждения
    logInfo("📤 Отправка кода...");
    const submitButton = await page.$('button[data-qa="account-login-submit"]');

    if (submitButton) {
      await submitButton.click();
    } else {
      // Пробуем нажать Enter
      await page.keyboard.press("Enter");
    }

    // Ждем обработки
    await new Promise((r) => setTimeout(r, 3000));

    // Проверяем результат
    const currentUrl = page.url();

    // Если мы больше не на странице входа - авторизация успешна
    if (
      !currentUrl.includes("/account/login") &&
      !currentUrl.includes("/login")
    ) {
      logInfo("✅ Авторизация по коду успешна!");
      return { success: true };
    }

    // Проверяем, не появилась ли ошибка
    const errorMessage = await page.$(
      '.form-field-error, [data-qa="account-login-code-error"], .error-message',
    );

    if (errorMessage) {
      const errorText = await errorMessage.evaluate((el) => el.textContent);

      if (errorText?.includes("неверн") || errorText?.includes("неправильн")) {
        return {
          success: false,
          error: "Неверный код подтверждения",
        };
      }

      if (errorText?.includes("время") || errorText?.includes("истёк")) {
        return {
          success: false,
          error: "Время ввода кода истекло. Запросите новый код",
        };
      }

      return {
        success: false,
        error: errorText || "Ошибка при проверке кода",
      };
    }

    // Если остались на странице с кодом, возможно код неверный
    const stillOnCodePage = await page.$(
      'div[data-qa="account-login-code-input"]',
    );

    if (stillOnCodePage) {
      return {
        success: false,
        error: "Неверный или истёкший код подтверждения",
      };
    }

    return {
      success: false,
      error: "Неизвестная ошибка при авторизации",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    logError(`❌ Ошибка при отправке кода: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Проверяет, остались ли мы на странице с кодом (ожидание ввода)
 * @param page - Puppeteer страница
 */
export async function isWaitingForCode(page: Page): Promise<boolean> {
  const codeInputDiv = await page.$('div[data-qa="account-login-code-input"]');
  return codeInputDiv !== null;
}

/**
 * Повторно отправляет код подтверждения
 * @param page - Puppeteer страница
 */
export async function resendVerificationCode(page: Page): Promise<boolean> {
  try {
    // Ищем кнопку повторной отправки кода
    const resendButton = await page.$(
      'button[data-qa="oauth-merge-by-code__code-resend"], button[data-qa="account-login-code-resend"], button[data-qa="code-resend"]',
    );

    if (resendButton) {
      await resendButton.click();
      await new Promise((r) => setTimeout(r, 2000));
      return true;
    }

    return false;
  } catch (error) {
    logError("Ошибка при повторной отправке кода:");
    console.error(error);
    return false;
  }
}
