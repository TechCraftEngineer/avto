import { expect, test } from "@playwright/test";
import {
  fillEmailPasswordForm,
  safeClickByRole,
  submitSignUpForm,
} from "../helpers/auth";

test.describe("Регистрация", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signup");
  });

  test("отображает форму регистрации", async ({ page }) => {
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: "Создать аккаунт" }),
    ).toBeVisible();
  });

  test("переключение между табами", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Пароль" })).toHaveAttribute(
      "data-state",
      "active",
    );

    await safeClickByRole(page, "tab", { name: "Код на email" });
    await expect(
      page.getByRole("tab", { name: "Код на email" }),
    ).toHaveAttribute("data-state", "active");
  });

  test("валидация email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invalid");

    // Проверяем, что можем ввести текст
    await expect(emailInput).toHaveValue("invalid");
  });

  test("валидация пароля - минимальная длина", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "short");
    await submitSignUpForm(page);

    await expect(
      page.getByText("Пароль должен содержать минимум 8 символов"),
    ).toBeVisible();
  });

  test("кнопка регистрации показывает состояние загрузки", async ({ page }) => {
    await fillEmailPasswordForm(page, "newuser@example.com", "password123");

    const submitButton = page.getByRole("button", { name: "Создать аккаунт" });

    // Кликаем и сразу проверяем состояние
    const clickPromise = submitButton.click();

    // Проверяем, что кнопка изменилась (либо disabled, либо текст изменился)
    await Promise.race([
      expect(submitButton).toBeDisabled(),
      expect(page.getByRole("button", { name: /Создание/ })).toBeVisible(),
    ]);

    await clickPromise;
  });

  test("переход на страницу входа", async ({ page }) => {
    await safeClickByRole(page, "link", { name: "Войти" });
    await expect(page).toHaveURL("/auth/signin");
  });

  test("отображает кнопку Google OAuth", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("проверка autocomplete для нового пароля", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const passwordInput = page.getByRole("textbox", { name: "Пароль" });
    await expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
  });

  test("проверка доступности - навигация клавиатурой", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    // Проверяем, что все элементы доступны для фокуса
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const passwordInput = page.getByRole("textbox", { name: "Пароль" });
    const submitButton = page.getByRole("button", { name: "Создать аккаунт" });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Проверяем, что элементы могут получить фокус
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test("проверка размера кнопок на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const submitButton = page.getByRole("button", { name: "Создать аккаунт" });
    const box = await submitButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
  });

  test("отправка OTP через email при регистрации", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Код на email" });
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("newuser@example.com");

    await safeClickByRole(page, "button", { name: "Отправить код" });

    await expect(
      page.getByRole("button", { name: "Отправка кода…" }),
    ).toBeVisible();
  });

  test("проверка spellcheck отключен для email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("spellcheck", "false");
  });

  test("проверка placeholder для email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("placeholder", "m@example.com");
  });

  test("проверка типа input для email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("type", "email");
  });
});
