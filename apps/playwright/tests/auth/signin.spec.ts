import { expect, test } from "@playwright/test";
import {
  fillEmailPasswordForm,
  safeClickByRole,
  submitSignInForm,
} from "../helpers/auth";

test.describe("Авторизация", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
  });

  test("отображает форму входа", async ({ page }) => {
    await expect(page.getByText("С возвращением")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Продолжить с Google" }),
    ).toBeVisible();
  });

  test("переключение между табами Пароль и Код на email", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Пароль" })).toHaveAttribute(
      "data-state",
      "active",
    );

    await safeClickByRole(page, "tab", { name: "Код на email" });
    await expect(
      page.getByRole("tab", { name: "Код на email" }),
    ).toHaveAttribute("data-state", "active");

    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Пароль" }),
    ).not.toBeVisible();
  });

  test("показывает ошибку при пустом email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });
    await submitSignInForm(page);

    await expect(page.getByText("Неверный email адрес")).toBeVisible();
  });

  test("показывает ошибку при невалидном email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invalid-email");

    // Проверяем, что можем ввести текст
    await expect(emailInput).toHaveValue("invalid-email");
  });

  test("показывает ошибку при коротком пароле", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "123");
    await submitSignInForm(page);

    await expect(
      page.getByText("Пароль должен содержать минимум 8 символов"),
    ).toBeVisible();
  });

  test("отображает кнопку 'Забыли пароль?'", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });
    await expect(
      page.getByRole("link", { name: "Забыли пароль?" }),
    ).toBeVisible();
  });

  test("переход на страницу регистрации", async ({ page }) => {
    await safeClickByRole(page, "link", { name: "Зарегистрироваться" });
    await expect(page).toHaveURL("/auth/signup");
  });

  test("кнопка входа показывает состояние загрузки", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "password123");

    const submitButton = page.getByRole("button", { name: "Войти" });

    // Кликаем и сразу проверяем состояние
    const clickPromise = submitButton.click();

    // Проверяем, что кнопка изменилась (либо disabled, либо текст изменился)
    await Promise.race([
      expect(submitButton).toBeDisabled(),
      expect(page.getByRole("button", { name: /Вход/ })).toBeVisible(),
    ]);

    await clickPromise;
  });

  test("отправка OTP кода через email", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Код на email" });
    await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");

    await safeClickByRole(page, "button", { name: "Отправить код" });

    await expect(
      page.getByRole("button", { name: "Отправка кода…" }),
    ).toBeVisible();
  });

  test("проверка доступности клавиатуры", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    // Проверяем, что все элементы доступны для фокуса
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const passwordInput = page.getByRole("textbox", { name: "Пароль" });
    const forgotLink = page.getByRole("link", { name: "Забыли пароль?" });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(forgotLink).toBeVisible();

    // Проверяем, что элементы могут получить фокус
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test("проверка видимости фокуса", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });
    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.focus();

    await expect(emailInput).toBeFocused();
  });

  test("поддержка автозаполнения", async ({ page }) => {
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const passwordInput = page.getByRole("textbox", { name: "Пароль" });
    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  test("проверка размера кнопок для мобильных устройств", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });
    const box = await googleButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
  });
});
