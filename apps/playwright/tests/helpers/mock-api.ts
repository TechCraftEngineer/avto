import type { Page, Route } from "@playwright/test";

/**
 * Mock входа по паролю (с задержкой для проверки состояния загрузки)
 * Better Auth: POST /api/auth/sign-in/email
 */
export async function mockSignInWithPassword(page: Page) {
  await page.route(/sign-in\/email(?!-otp)/, async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      }),
    });
  });
}

/**
 * Mock отправки OTP с signin-страницы (кнопка «Отправить код»)
 * Better Auth: POST /api/auth/email-otp/send-verification-otp
 */
export async function mockSendOTP(page: Page) {
  await page.route(/send-verification-otp/, async (route: Route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "OTP sent" }),
    });
  });
}

/**
 * Mock верификации OTP при вводе 6 цифр
 * Better Auth: POST /api/auth/sign-in/email-otp
 */
export async function mockVerifyOTP(page: Page) {
  await page.route(/sign-in\/email-otp/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "mock-id", email: "test@example.com", name: null },
        session: { userId: "mock-id" },
      }),
    });
  });
}

/**
 * Mock для успешной отправки OTP
 * Better Auth использует /api/auth/email-otp/send-verification-otp для sendVerificationOtp
 * Задержка гарантирует, что состояние "Отправка…" остаётся видимым в тестах
 */
export async function mockOTPResend(page: Page) {
  await page.route(/send-verification-otp/, async (route: Route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "OTP resent successfully",
      }),
    });
  });
}

/**
 * Mock для регистрации (с задержкой для тестирования состояния загрузки)
 */
export async function mockSignUp(page: Page) {
  await page.route(/sign-up\/email/, async (route: Route) => {
    await new Promise((r) => setTimeout(r, 2000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "mock-user-id",
          email: "newuser@example.com",
          name: "newuser",
        },
        session: {
          userId: "mock-user-id",
        },
      }),
    });
  });
}

/**
 * Mock для ошибки отправки OTP
 */
export async function mockOTPResendError(page: Page) {
  await page.route(/send-verification-otp/, async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Failed to send OTP",
      }),
    });
  });
}
