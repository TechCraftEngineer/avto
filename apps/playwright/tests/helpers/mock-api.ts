import type { Page, Route } from "@playwright/test";

/**
 * Настройка mock для auth API
 */
export async function mockAuthAPI(page: Page) {
  // Mock для отправки OTP кода
  await page.route("**/api/auth/signin", async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Если это запрос на отправку OTP
    if (postData?.email && !postData?.otp) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "OTP sent successfully",
        }),
      });
      return;
    }

    // Если это верификация OTP
    if (postData?.otp) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: {
            id: "mock-user-id",
            email: postData.email,
          },
        }),
      });
      return;
    }

    // Для остальных случаев пропускаем запрос
    await route.continue();
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
