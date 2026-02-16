import type { Page } from "puppeteer";

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

    const codeInputContainer = await page.$(
      'div[data-qa="account-login-code-input"]',
    );

    if (!codeInputContainer) {
      return {
        success: false,
        error: "Контейнер для ввода кода не найден",
      };
    }

    // 1. Единое поле magritte-pincode (data-qa, не id) — maxlength 6, принимает код
    const pincodeInput = await page.$('[data-qa="magritte-pincode-input-field"]');
    if (pincodeInput) {
      await pincodeInput.click();
      await pincodeInput.type(code, { delay: 100 });
    } else {
      const inputFields = await codeInputContainer.$$("input");
      if (inputFields.length === 0) {
        return {
          success: false,
          error: "Поле для ввода кода не найдено",
        };
      }
      // 2. Много слотов (4, 6...) — по цифре в каждый
      if (code.length <= inputFields.length) {
        const codeDigits = code.split("");
        for (let i = 0; i < codeDigits.length; i++) {
          const digit = codeDigits[i];
          const slot = inputFields[i];
          if (digit !== undefined && slot) {
            await slot.type(digit, { delay: 100 });
          }
        }
      } else {
        // 3. Код длиннее слотов (напр. 4+ цифр при 2 слотах oauth-merge-by-code)
        // Распределяем цифры по слотам, задаём value через JS (обходим maxLength=1)
        const codeDigits = code.split("");
        const perSlot = Math.ceil(codeDigits.length / inputFields.length);
        await page.evaluate(
          ({ digits, perSlot: p }) => {
            const container = document.querySelector(
              'div[data-qa="account-login-code-input"]',
            );
            const inputs = Array.from(container?.querySelectorAll("input") ?? []);
            for (let s = 0; s < inputs.length; s++) {
              const chunk = digits.slice(s * p, (s + 1) * p).join("");
              const el = inputs[s] as HTMLInputElement | undefined;
              if (el && chunk) {
                el.value = chunk;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          },
          { digits: codeDigits, perSlot },
        );
      }
    }

    // Небольшая пауза перед отправкой
    await new Promise((r) => setTimeout(r, 500));

    // Нажимаем кнопку подтверждения
    logInfo("📤 Отправка кода...");
    const submitButton = await page.$('button[data-qa="account-login-submit"]');

    // Ожидаем навигации до клика — иначе после навигации execution context уничтожается
    const navPromise = page
      .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 })
      .catch(() => null);

    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    await navPromise;

    const currentUrl = page.url();

    if (
      !currentUrl.includes("/account/login") &&
      !currentUrl.includes("/login")
    ) {
      logInfo("✅ Авторизация по коду успешна!");
      return { success: true };
    }

    // Остались на странице входа — проверяем ошибки
    try {
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

      const stillOnCodePage = await page.$(
        'div[data-qa="account-login-code-input"]',
      );

      if (stillOnCodePage) {
        return {
          success: false,
          error: "Неверный или истёкший код подтверждения",
        };
      }
    } catch (checkError) {
      const msg =
        checkError instanceof Error ? checkError.message : String(checkError);
      if (msg.includes("Execution context was destroyed")) {
        const url = page.url();
        if (
          !url.includes("/account/login") &&
          !url.includes("/login")
        ) {
          logInfo("✅ Авторизация по коду успешна (навигация)");
          return { success: true };
        }
      }
      throw checkError;
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
