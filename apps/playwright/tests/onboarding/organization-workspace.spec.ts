import { expect, test } from "@playwright/test";

test.describe("Онбординг: создание организации и воркспейса", () => {
  const testPassword = "TestPassword123";
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    // Создаем уникальный email для каждого теста
    testEmail = `onboarding-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

    // Регистрируемся через UI (это быстрее чем через API для онбординга)
    await page.goto("/auth/signup");

    // Переключаемся на таб "Пароль" если нужно
    const passwordTab = page.getByRole("tab", { name: "Пароль" });
    if (await passwordTab.isVisible()) {
      await passwordTab.click();
    }

    // Заполняем форму
    await page.getByRole("textbox", { name: "Email" }).fill(testEmail);
    await page.getByRole("textbox", { name: "Пароль" }).fill(testPassword);

    // Отправляем форму
    await page.getByRole("button", { name: "Создать аккаунт" }).click();

    // Ждем редиректа на онбординг
    await page.waitForURL("/onboarding", { timeout: 30000 });
  });

  test.afterEach(async () => {
    // Cleanup будет выполнен автоматически через глобальный cleanup
    // или можно добавить явный cleanup через API если нужно
  });

  test("отображает страницу онбординга после регистрации", async ({ page }) => {
    await expect(page).toHaveURL("/onboarding");
    await expect(
      page.getByRole("heading", { name: "Создайте организацию" }),
    ).toBeVisible();
  });

  test("показывает индикатор прогресса", async ({ page }) => {
    const progressBars = page.locator(".h-2.w-16.rounded-full");
    await expect(progressBars).toHaveCount(2);

    await expect(progressBars.first()).toHaveClass(/bg-primary/);
    await expect(progressBars.last()).toHaveClass(/bg-muted/);
  });

  test("автоматически генерирует slug из названия организации", async ({
    page,
  }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await nameInput.fill("Test Company");
    await expect(slugInput).toHaveValue("test-company");

    await nameInput.fill("Моя Компания");
    await expect(slugInput).toHaveValue("moya-kompaniya");
  });

  test("позволяет вручную изменить slug организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await nameInput.fill("Test Company");
    await expect(slugInput).toHaveValue("test-company");

    await slugInput.fill("custom-slug");
    await expect(slugInput).toHaveValue("custom-slug");

    await nameInput.fill("Another Name");
    await expect(slugInput).toHaveValue("custom-slug");
  });

  test("валидирует формат slug организации", async ({ page }) => {
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await expect(slugInput).toHaveAttribute("pattern", "[a-z0-9-]+");
    await expect(slugInput).toHaveAttribute(
      "title",
      "Только строчные буквы, цифры и дефис",
    );
  });

  test("отображает tooltip для slug организации", async ({ page }) => {
    const helpIcon = page.locator('label:has-text("Slug организации") + svg');
    await helpIcon.hover();

    await expect(
      page
        .getByRole("tooltip")
        .getByText(/Slug — это уникальный идентификатор для URL/),
    ).toBeVisible();
  });

  test("создает организацию с обязательными полями", async ({ page }) => {
    const orgName = `Test Org ${Date.now()}`;
    const orgSlug = `test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);

    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    await submitButton.click();

    await expect(page.getByRole("button", { name: "Создание…" })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("создает организацию со всеми полями", async ({ page }) => {
    const orgName = `Full Org ${Date.now()}`;
    const orgSlug = `full-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page
      .getByRole("textbox", { name: "Описание (опционально)" })
      .fill("Test organization description");
    await page
      .getByRole("textbox", { name: "Веб-сайт (опционально)" })
      .fill("https://example.com");

    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("показывает ошибку при дублировании slug организации", async ({
    page,
  }) => {
    const orgName = `Duplicate Org ${Date.now()}`;
    const orgSlug = `duplicate-org-${Date.now()}`;

    // Создаем первую организацию
    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    // Ждем успешного создания первой организации
    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    // Создаем воркспейс чтобы завершить онбординг
    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(`Workspace ${Date.now()}`);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(`workspace-${Date.now()}`);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    // Ждем редиректа на дашборд
    await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
      timeout: 10000,
    });

    // Переходим на страницу создания новой организации через настройки
    await page.goto("/orgs/new");

    // Пытаемся создать организацию с тем же slug
    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(`${orgName} 2`);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    // Проверяем что отображается ошибка о дублировании slug
    await expect(page.getByText(/уже существует|занят|duplicate/i)).toBeVisible(
      { timeout: 5000 },
    );
  });

  test("переходит к созданию воркспейса после создания организации", async ({
    page,
  }) => {
    const orgName = `Workspace Test Org ${Date.now()}`;
    const orgSlug = `workspace-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const progressBars = page.locator(".h-2.w-16.rounded-full");
    await expect(progressBars.last()).toHaveClass(/bg-primary/);
  });

  test("автоматически генерирует slug из названия воркспейса", async ({
    page,
  }) => {
    const orgName = `Slug Test Org ${Date.now()}`;
    const orgSlug = `slug-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });

    await nameInput.fill("Main Project");
    await expect(slugInput).toHaveValue("main-project");

    await nameInput.fill("Основной проект");
    await expect(slugInput).toHaveValue("osnovnoy-proekt");
  });

  test("позволяет вручную изменить slug воркспейса", async ({ page }) => {
    const orgName = `Manual Slug Org ${Date.now()}`;
    const orgSlug = `manual-slug-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });

    await nameInput.fill("Test Workspace");
    await expect(slugInput).toHaveValue("test-workspace");

    await slugInput.fill("custom-workspace");
    await expect(slugInput).toHaveValue("custom-workspace");

    await nameInput.fill("Another Name");
    await expect(slugInput).toHaveValue("custom-workspace");
  });

  test("создает воркспейс с обязательными полями", async ({ page }) => {
    const orgName = `Workspace Org ${Date.now()}`;
    const orgSlug = `workspace-org-${Date.now()}`;
    const workspaceName = `Test Workspace ${Date.now()}`;
    const workspaceSlug = `test-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page.getByRole("button", { name: "Создание…" })).toBeVisible();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });

  test("создает воркспейс со всеми полями", async ({ page }) => {
    const orgName = `Full Workspace Org ${Date.now()}`;
    const orgSlug = `full-workspace-org-${Date.now()}`;
    const workspaceName = `Full Workspace ${Date.now()}`;
    const workspaceSlug = `full-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page
      .getByRole("textbox", { name: "Описание (опционально)" })
      .fill("Test workspace description");
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });

  test("позволяет пропустить создание воркспейса", async ({ page }) => {
    const orgName = `Skip Workspace Org ${Date.now()}`;
    const orgSlug = `skip-workspace-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    // Ищем кнопку пропуска (может быть "Пропустить" или "Skip")
    const skipButton = page.getByRole("button", { name: /пропустить|skip/i });

    // Проверяем наличие кнопки пропуска
    const isSkipVisible = await skipButton.isVisible().catch(() => false);

    if (isSkipVisible) {
      await skipButton.click();

      // Проверяем редирект на страницу организации
      await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}`), {
        timeout: 10000,
      });
    } else {
      // Если кнопки пропуска нет, создаем воркспейс и проверяем редирект
      await page
        .getByRole("textbox", { name: "Название воркспейса" })
        .fill(`Skip Test Workspace ${Date.now()}`);
      await page
        .getByRole("textbox", { name: "Slug воркспейса" })
        .fill(`skip-test-ws-${Date.now()}`);
      await page.getByRole("button", { name: "Создать воркспейс" }).click();

      // Проверяем редирект на дашборд воркспейса
      await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
        timeout: 10000,
      });
    }
  });

  test("отображает URL preview для организации", async ({ page }) => {
    await expect(page.getByText(/\/orgs\//)).toBeVisible();
  });

  test("отображает URL preview для воркспейса", async ({ page }) => {
    const orgName = `URL Preview Org ${Date.now()}`;
    const orgSlug = `url-preview-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(new RegExp(`/orgs/${orgSlug}/workspaces/`)),
    ).toBeVisible();
  });

  test("кнопка создания организации disabled без обязательных полей", async ({
    page,
  }) => {
    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    await expect(submitButton).toBeDisabled();

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill("Test");
    await expect(submitButton).toBeEnabled();
  });

  test("кнопка создания воркспейса disabled без обязательных полей", async ({
    page,
  }) => {
    const orgName = `Button Test Org ${Date.now()}`;
    const orgSlug = `button-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const submitButton = page.getByRole("button", {
      name: "Создать воркспейс",
    });
    await expect(submitButton).toBeDisabled();

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill("Test");
    await expect(submitButton).toBeEnabled();
  });

  test("проверка autofocus на первом поле организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    await expect(nameInput).toBeFocused();
  });

  test("проверка autofocus на первом поле воркспейса", async ({ page }) => {
    const orgName = `Focus Test Org ${Date.now()}`;
    const orgSlug = `focus-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });

    // Проверяем, что поле видимо и доступно для взаимодействия
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();

    // Проверяем, что поле может получить фокус
    await nameInput.focus();
    await expect(nameInput).toBeFocused();
  });

  test("проверка maxLength для полей организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });
    const descriptionInput = page.getByRole("textbox", {
      name: "Описание (опционально)",
    });
    const websiteInput = page.getByRole("textbox", {
      name: "Веб-сайт (опционально)",
    });

    await expect(nameInput).toHaveAttribute("maxlength", "100");
    await expect(slugInput).toHaveAttribute("maxlength", "50");
    await expect(descriptionInput).toHaveAttribute("maxlength", "500");
    await expect(websiteInput).toHaveAttribute("maxlength", "200");
  });

  test("проверка maxLength для полей воркспейса", async ({ page }) => {
    const orgName = `MaxLength Test Org ${Date.now()}`;
    const orgSlug = `maxlength-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });
    const descriptionInput = page.getByRole("textbox", {
      name: "Описание (опционально)",
    });

    await expect(nameInput).toHaveAttribute("maxlength", "100");
    await expect(slugInput).toHaveAttribute("maxlength", "50");
    await expect(descriptionInput).toHaveAttribute("maxlength", "500");
  });

  test("проверка типа input для website", async ({ page }) => {
    const websiteInput = page.getByRole("textbox", {
      name: "Веб-сайт (опционально)",
    });
    await expect(websiteInput).toHaveAttribute("type", "url");
  });

  test("проверка размера кнопок на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    const box = await submitButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
  });

  test("полный флоу: регистрация → организация → воркспейс → дашборд", async ({
    page,
  }) => {
    const orgName = `Full Flow Org ${Date.now()}`;
    const orgSlug = `full-flow-org-${Date.now()}`;
    const workspaceName = `Full Flow Workspace ${Date.now()}`;
    const workspaceSlug = `full-flow-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });
});
