import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Настройки каналов общения вакансий", () => {
  test.describe.configure({ mode: "parallel" });

  let testUser: TestUser;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
    workspaceSlug = testUser.workspace.slug;
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.email);
  });

  test.describe("Настройки каналов общения", () => {
    test("отображает настройки каналов общения", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для каналов общения");
      await page.getByLabel(/описание/i).fill("Тестовое описание вакансии");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      // Ждем создания вакансии и переходим на страницу настроек
      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      const vacancyId = url.split("/").pop();

      await page.goto(`${url}/settings`);

      // Проверяем отображение настроек каналов общения
      await expect(
        page.getByRole("heading", { name: /каналы общения/i }),
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByText(/выберите каналы.*которые кандидаты смогут общаться/i),
      ).toBeVisible();
    });

    test("отображает переключатели каналов", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для переключателей");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Проверяем наличие переключателей
      await expect(page.getByLabel(/веб-чат/i)).toBeVisible();
      await expect(page.getByLabel(/telegram/i)).toBeVisible();

      // Проверяем что веб-чат включен по умолчанию
      await expect(page.getByLabel(/веб-чат/i)).toBeChecked();

      // Проверяем что Telegram отключен по умолчанию
      await expect(page.getByLabel(/telegram/i)).not.toBeChecked();
    });

    test("показывает предупреждение при отсутствии Telegram интеграции", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для Telegram");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Проверяем предупреждение о Telegram интеграции
      await expect(
        page.getByText(/telegram интеграция не настроена/i),
      ).toBeVisible();

      // Проверяем что переключатель Telegram отключен
      const telegramSwitch = page.getByLabel(/telegram/i);
      await expect(telegramSwitch).not.toBeChecked();
      await expect(telegramSwitch).toBeDisabled();
    });

    test("сохраняет настройки каналов общения", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для сохранения");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Проверяем начальное состояние
      await expect(page.getByLabel(/веб-чат/i)).toBeChecked();

      // Отключаем веб-чат
      await page.getByLabel(/веб-чат/i).click();
      await expect(page.getByLabel(/веб-чат/i)).not.toBeChecked();

      // Сохраняем настройки
      await page.getByRole("button", { name: /сохранить настройки/i }).click();

      // Проверяем сообщение об успехе
      await expect(page.getByText(/настройки сохранены/i)).toBeVisible();

      // Перезагружаем страницу и проверяем что настройки сохранились
      await page.reload();
      await expect(page.getByLabel(/веб-чат/i)).not.toBeChecked();
    });
  });

  test.describe("Шаблоны приветствия", () => {
    test("отображает шаблоны приветствия", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для шаблонов");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Проверяем отображение шаблонов приветствия
      await expect(
        page.getByRole("heading", { name: /шаблоны приветствия/i }),
      ).toBeVisible();

      await expect(
        page.getByLabel(/приветствие в веб-чате/i),
      ).toBeVisible();

      await expect(
        page.getByLabel(/приветствие в telegram/i),
      ).toBeVisible();
    });

    test("отключает поля при отключенных каналах", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для отключения");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Отключаем веб-чат
      await page.getByLabel(/веб-чат/i).click();

      // Проверяем что поле веб-чата отключено
      const webChatTextarea = page.getByLabel(/приветствие в веб-чате/i);
      await expect(webChatTextarea).toBeDisabled();

      // Проверяем что поле Telegram отключено
      const telegramTextarea = page.getByLabel(/приветствие в telegram/i);
      await expect(telegramTextarea).toBeDisabled();
    });

    test("сохраняет шаблоны приветствия", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для шаблонов сохранения");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Вводим текст в шаблоны
      const webChatTemplate = "Привет! Добро пожаловать в наш чат.";
      const telegramTemplate = "Здравствуйте! Начнем собеседование.";

      await page.getByLabel(/приветствие в веб-чате/i).fill(webChatTemplate);
      await page.getByLabel(/приветствие в telegram/i).fill(telegramTemplate);

      // Сохраняем
      await page.getByRole("button", { name: /сохранить настройки/i }).click();

      // Проверяем сообщение об успехе
      await expect(page.getByText(/настройки сохранены/i)).toBeVisible();

      // Перезагружаем и проверяем сохранение
      await page.reload();
      await expect(page.getByLabel(/приветствие в веб-чате/i)).toHaveValue(webChatTemplate);
      await expect(page.getByLabel(/приветствие в telegram/i)).toHaveValue(telegramTemplate);
    });

    test("отображает превью шаблонов", async ({ page }) => {
      // Создаем тестовую вакансию
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);

      await page.getByRole("button", { name: /создать вакансию/i }).click();
      await page.getByLabel(/название вакансии/i).fill("Тестовая вакансия для превью");
      await page.getByLabel(/описание/i).fill("Тестовое описание");
      await page.getByRole("button", { name: /создать вакансию/i }).click();

      await page.waitForURL(/\/vacancies\/[^\/]+$/);
      const url = page.url();
      await page.goto(`${url}/settings`);

      // Проверяем наличие превью
      await expect(
        page.getByRole("heading", { name: /превью приветствий/i }),
      ).toBeVisible();

      // Открываем модальное окно превью
      await page.getByRole("button", { name: /посмотреть превью/i }).click();

      // Проверяем содержимое превью
      await expect(page.getByText(/превью приветственных сообщений/i)).toBeVisible();
      await expect(page.getByText(/веб-чат/i)).toBeVisible();
      await expect(page.getByText(/telegram/i)).toBeVisible();
    });
  });
});