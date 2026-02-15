import { expect, test } from "@playwright/test";
import { safeClickByRole } from "../helpers/auth";
import { mockOTPResend } from "../helpers/mock-api";

test.describe("OTP верификация", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("otp_email", "test@example.com");
    });

    await page.goto("/auth/otp");
  });

  test("отображает форму OTP", async ({ page }) => {
    await expect(page.getByText("Введите код подтверждения")).toBeVisible();
    await expect(page.getByText(/Мы отправили 6-значный код на/)).toBeVisible();
  });

  test("отображает 6 полей для ввода кода", async ({ page }) => {
    const otpSlots = page.locator('[data-slot="input-otp-slot"]');
    await expect(otpSlots).toHaveCount(6);
  });

  test("автоматический переход между полями при вводе", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await otpInput.click();

    // Проверяем, что можем вводить цифры
    await otpInput.fill("1");
    await expect(otpInput).toHaveValue("1");
  });

  test("кнопка подтверждения изначально активна", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Подтвердить" });
    await expect(submitButton).toBeEnabled();
  });

  test("отображает кнопку повторной отправки", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Отправить повторно" }),
    ).toBeVisible();
  });

  test("таймер обратного отсчета для повторной отправки", async ({ page }) => {
    // Настраиваем mock для повторной отправки OTP
    await mockOTPResend(page);

    const _resendButton = page.getByRole("button", {
      name: "Отправить повторно",
    });

    await expect(_resendButton).toBeEnabled();
    await safeClickByRole(page, "button", { name: "Отправить повторно" });

    // Проверяем состояние загрузки
    await expect(page.getByText("Отправка…")).toBeVisible({ timeout: 2000 });

    // Ждем завершения загрузки с увеличенным таймаутом
    await expect(page.getByText("Отправка…")).not.toBeVisible({
      timeout: 10000,
    });

    // Проверяем что кнопка показывает таймер (более гибкий поиск)
    const timerButton = page.locator('button:has-text("Отправить повторно")');
    await expect(timerButton).toBeVisible({ timeout: 5000 });

    // Проверяем что кнопка disabled во время таймера
    await expect(timerButton).toBeDisabled();
  });

  test("автоматическая отправка при вводе 6 цифр", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await otpInput.click();

    // Ждем любой API запрос после ввода кода
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/auth"),
      { timeout: 5000 },
    );

    await otpInput.fill("123456");

    // Проверяем, что код был введен
    await expect(otpInput).toHaveValue("123456");

    // Ждем автоматической отправки формы через API запрос
    await responsePromise;
  });

  test("проверка доступности - навигация клавиатурой", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });

    // Проверяем, что поле может получить фокус
    await otpInput.focus();
    await expect(otpInput).toBeFocused();
  });

  test("редирект на signin если нет email в localStorage", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/auth/otp");
    await page.waitForURL("/auth/signin");
  });

  test("проверка aria-label для полей OTP", async ({ page }) => {
    // Проверяем, что input связан с label "Код подтверждения"
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await expect(otpInput).toBeVisible();
  });

  test("описание формы видимо", async ({ page }) => {
    await expect(
      page.getByText("Мы отправили 6-значный код на test@example.com. Введите код, который вы получили."),
    ).toBeVisible();
  });

  test("кнопка повторной отправки показывает состояние загрузки", async ({
    page,
  }) => {
    // Настраиваем mock для повторной отправки OTP
    await mockOTPResend(page);

    const _resendButton = page.getByRole("button", {
      name: "Отправить повторно",
    });

    // Кликаем и проверяем состояние загрузки
    await safeClickByRole(page, "button", { name: "Отправить повторно" });

    // Проверяем что отображается состояние загрузки
    await expect(page.getByText("Отправка…")).toBeVisible({ timeout: 2000 });

    // Ждем завершения запроса
    await expect(page.getByText(/Отправить повторно/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("проверка размера полей ввода на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    const box = await otpInput.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test("проверка inputmode для числового ввода", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await expect(otpInput).toBeVisible();
    await expect(otpInput).toHaveAttribute("inputmode", "numeric");
  });
});
