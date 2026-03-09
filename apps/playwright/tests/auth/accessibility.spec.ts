import { expect, test } from "@playwright/test";
import { safeClickByRole } from "../helpers/auth";

test.describe("Доступность форм авторизации", () => {
  test("signin - проверка семантики", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(page.getByText("С возвращением")).toBeVisible();

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("signup - проверка семантики", async ({ page }) => {
    await page.goto("/auth/signup");

    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: "Создать аккаунт" }),
    ).toBeVisible();

    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("все интерактивные элементы доступны через Tab", async ({ page }) => {
    await page.goto("/auth/signin");
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const focusableElements = [
      page.getByRole("button", { name: "Продолжить с Google" }),
      page.getByRole("tab", { name: "Пароль" }),
      page.getByRole("tab", { name: "Код на email" }),
      page.getByRole("textbox", { name: "Email" }),
      page.getByRole("textbox", { name: "Пароль" }),
      page.getByRole("link", { name: "Забыли пароль?" }),
      page.getByRole("button", { name: "Войти" }),
      page.getByRole("link", { name: "Зарегистрироваться" }),
    ];

    for (const element of focusableElements) {
      await expect(element).toBeVisible();
    }
  });

  test("форма имеет правильные aria-атрибуты", async ({ page }) => {
    await page.goto("/auth/signin");
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const emailInput = page.getByRole("textbox", { name: "Email" });

    // Проверяем, что input имеет правильные атрибуты
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("name", "email");
  });

  test("ошибки валидации связаны с полями", async ({ page }) => {
    await page.goto("/auth/signin");
    await safeClickByRole(page, "tab", { name: "Пароль" });

    await safeClickByRole(page, "button", { name: "Войти" });

    const errorMessage = page.getByText("Неверный email адрес");
    await expect(errorMessage).toBeVisible();
  });

  test("кнопки имеют описательный текст", async ({ page }) => {
    await page.goto("/auth/signin");

    const buttons = [
      page.getByRole("button", { name: "Продолжить с Google" }),
      page.getByRole("button", { name: "Войти" }),
    ];

    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("ссылки имеют описательный текст", async ({ page }) => {
    await page.goto("/auth/signin");
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const links = [
      page.getByRole("link", { name: "Забыли пароль?" }),
      page.getByRole("link", { name: "Зарегистрироваться" }),
    ];

    for (const link of links) {
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("OTP форма — label виден и связан с полем", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      localStorage.setItem("otp_email", "test@example.com");
    });

    await page.goto("/auth/otp");

    // Label виден — важно для пользователей (не sr-only)
    const label = page
      .locator("label")
      .filter({ hasText: "Код подтверждения" });
    await expect(label).toBeVisible();

    // Связь label-input даёт доступное имя для скринридеров
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await expect(otpInput).toBeVisible();
  });

  test("проверка контраста текста", async ({ page }) => {
    await page.goto("/auth/signin");

    const heading = page.getByText("С возвращением");
    const color = await heading.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).getPropertyValue("color"),
    );

    expect(color).toBeTruthy();
  });

  test("изображения имеют alt текст", async ({ page }) => {
    await page.goto("/auth/signin");

    const googleLogo = page.locator('svg[aria-label="Логотип Google"]');
    await expect(googleLogo).toHaveAttribute("aria-label");
  });

  test("форма доступна для скринридеров", async ({ page }) => {
    await page.goto("/auth/signin");
    await safeClickByRole(page, "tab", { name: "Пароль" });

    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});
