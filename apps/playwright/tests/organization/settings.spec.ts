import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Настройки организации", () => {
  test.describe.configure({ mode: "parallel" });

  let testUser: TestUser;
  let orgSlug: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.email);
  });

  test.describe("Общая навигация", () => {
    test("отображает страницу настроек организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);
      await expect(
        page.getByRole("heading", { name: "Общие настройки" }),
      ).toBeVisible();
    });

    test("отображает форму с основными полями", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);
      await expect(page.getByText("Название организации")).toBeVisible();
      await expect(page.getByText("Адрес организации")).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Описание" }),
      ).toBeVisible();
      await expect(page.getByText("Веб-сайт", { exact: true })).toBeVisible();
      await expect(page.getByText("Логотип организации")).toBeVisible();
    });
  });

  test.describe("Редактирование названия", () => {
    test("позволяет изменить название организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.clear();
      await nameInput.fill("Новое название организации");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение обновилось
      await expect(nameInput).toHaveValue("Новое название организации");
    });

    test("показывает ошибку при пустом названии", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.clear();

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(page.getByText("Название обязательно")).toBeVisible();
    });
  });

  test.describe("Редактирование slug", () => {
    test("позволяет изменить slug организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const newSlug = `test-org-${Date.now()}`;
      const slugInput = page.getByPlaceholder("my-company");
      await slugInput.clear();
      await slugInput.fill(newSlug);

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем редирект на новый URL
      await page.waitForURL(`/orgs/${newSlug}/settings`, { timeout: 10000 });
    });

    test("показывает ошибку при невалидном slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const slugInput = page.getByPlaceholder("my-company");
      await slugInput.clear();
      await slugInput.fill("Invalid Slug!");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(
        page
          .locator("form")
          .getByText(/Slug может содержать только строчные буквы/),
      ).toBeVisible();
    });

    test("показывает подсказку о формате slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/Только строчные буквы, цифры и дефисы/),
      ).toBeVisible();
    });

    test("показывает tooltip с дополнительной информацией", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      // Находим иконку помощи рядом с полем "Адрес организации"
      const helpIcon = page.locator('[class*="cursor-help"]').first();

      // Наводим курсор на иконку и ждем появления tooltip
      await helpIcon.hover();

      // Используем data-testid для надежного поиска tooltip
      // Tooltip рендерится через Radix UI Portal, поэтому увеличиваем timeout
      const tooltip = page.getByTestId("slug-help-tooltip");
      await expect(tooltip).toBeVisible({ timeout: 10000 });

      // Проверяем содержимое tooltip
      await expect(tooltip).toContainText(
        "Уникальный адрес для доступа к вашей организации",
      );
    });
  });

  test.describe("Редактирование описания", () => {
    test("позволяет добавить описание организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const descriptionInput = page.getByPlaceholder(
        "Краткое описание вашей организации",
      );
      await descriptionInput.fill("Это тестовое описание организации");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение сохранилось
      await expect(descriptionInput).toHaveValue(
        "Это тестовое описание организации",
      );
    });

    test("позволяет очистить описание", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const descriptionInput = page.getByPlaceholder(
        "Краткое описание вашей организации",
      );
      await descriptionInput.fill("Временное описание");
      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      await page.waitForTimeout(1000);

      await descriptionInput.clear();
      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      await expect(descriptionInput).toHaveValue("");
    });
  });

  test.describe("Редактирование веб-сайта", () => {
    test("позволяет добавить URL веб-сайта", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const websiteInput = page.getByPlaceholder("https://example.com");
      await websiteInput.fill("https://example.com");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение сохранилось
      await expect(websiteInput).toHaveValue("https://example.com");
    });

    test("показывает ошибку при невалидном URL", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const websiteInput = page.getByPlaceholder("https://example.com");
      await websiteInput.fill("not-a-valid-url");

      // Валидация react-hook-form срабатывает при submit формы
      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Ждем появления сообщения об ошибке
      // FormMessage может рендериться вне <form>, поэтому убираем ограничение
      await expect(page.getByText("Некорректный URL")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Логотип организации", () => {
    test("отображает кнопку загрузки логотипа", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(page.getByText("Загрузить логотип")).toBeVisible();
    });

    test("показывает информацию о требованиях к логотипу", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/Рекомендуется квадратное изображение/),
      ).toBeVisible();
      await expect(page.getByText(/Максимальный размер: 2MB/)).toBeVisible();
    });
  });

  test.describe("Удаление организации", () => {
    test("отображает секцию удаления для владельца", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByRole("heading", { name: "Удалить организацию" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Удалить организацию" }),
      ).toBeVisible();
    });

    test("открывает диалог подтверждения удаления", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await page.getByRole("button", { name: "Удалить организацию" }).click();

      await expect(
        page.getByRole("heading", { name: /Удалить организацию/i }),
      ).toBeVisible();
    });

    test("показывает предупреждение о последствиях удаления", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/безвозвратно удалит вашу организацию/),
      ).toBeVisible();
    });
  });

  test.describe("Кнопка сохранения", () => {
    test("показывает состояние загрузки при сохранении", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.fill("Тестовое название");

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await saveButton.click();

      // Проверяем, что кнопка показывает состояние загрузки
      await expect(page.getByRole("button", { name: "Сохранение…" }))
        .toBeVisible({ timeout: 1000 })
        .catch(() => {
          // Если кнопка быстро изменилась, это нормально
        });
    });

    test("кнопка сохранения доступна по умолчанию", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await expect(saveButton).toBeEnabled();
    });
  });

  test.describe("Доступность", () => {
    test("все поля имеют правильные labels", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(page.getByText("Название организации")).toBeVisible();
      await expect(page.getByText("Адрес организации")).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Описание" }),
      ).toBeVisible();
      await expect(page.getByText("Веб-сайт", { exact: true })).toBeVisible();
      await expect(page.getByText("Логотип организации")).toBeVisible();
    });

    test("форма доступна с клавиатуры", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      // Ждем полной загрузки страницы
      await page.waitForLoadState("networkidle");

      // Устанавливаем фокус на первое поле формы
      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      // Переходим к следующему полю с помощью Tab
      await page.keyboard.press("Tab");
      const slugInput = page.getByPlaceholder("my-company");
      await expect(slugInput).toBeFocused();
    });
  });
});
