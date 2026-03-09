import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { Page } from "@playwright/test";
import type { AppRouter } from "@qbs-autonaim/api";

export interface TestUser {
  email: string;
  password: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  dashboardUrl: string;
}

/**
 * Создание oRPC клиента для тестов
 */
function createTestORPCClient(baseURL: string) {
  const link = new RPCLink({
    url: `${baseURL}/api/orpc`,
  });
  return createORPCClient<AppRouter>(link);
}

/**
 * Быстрое создание тестового пользователя с организацией и workspace через oRPC
 * Ускоряет тесты в 10+ раз по сравнению с UI онбордингом
 */
export async function createTestUser(
  baseURL = "http://localhost:3000",
  options?: {
    email?: string;
    password?: string;
    name?: string;
    orgName?: string;
    workspaceName?: string;
  },
): Promise<TestUser> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  const email = options?.email || `test-${timestamp}-${random}@example.com`;
  const password = options?.password || "TestPassword123";

  const orpc = createTestORPCClient(baseURL);

  // Retry механизм для создания пользователя
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Если пользователь уже существует, сначала удаляем его
      if (lastError?.message?.includes("User already exists")) {
        try {
          await orpc.test.cleanup({ email });
          // Ждем немного после удаления
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (cleanupError) {
          // Игнорируем ошибки cleanup
          console.warn(`Cleanup failed for ${email}:`, cleanupError);
        }
      }

      const result = await orpc.test.setup({
        email,
        password,
        name: options?.name,
        orgName: options?.orgName,
        workspaceName: options?.workspaceName,
      });

      if (
        !result ||
        !result.user ||
        !result.organization ||
        !result.workspace ||
        !result.dashboardUrl
      ) {
        throw new Error("Invalid response from test setup API");
      }

      return {
        email,
        password,
        user: result.user,
        organization: result.organization,
        workspace: result.workspace,
        dashboardUrl: result.dashboardUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Ждем перед повторной попыткой (экспоненциальная задержка)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `Failed to create test user after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

export interface ArchivedVacancy {
  vacancyId: string;
  title: string;
}

/**
 * Создание архивной HH вакансии для E2E тестов (только в dev/test режиме)
 */
export async function createArchivedVacancy(
  testUser: TestUser,
  baseURL = "http://localhost:3000",
  title?: string,
): Promise<ArchivedVacancy> {
  const orpc = createTestORPCClient(baseURL);
  const result = await orpc.test.createArchivedVacancy({
    workspaceId: testUser.workspace.id,
    createdBy: testUser.user.id,
    title,
  });
  return result;
}

/**
 * Удаление тестового пользователя и всех связанных данных через oRPC
 */
export async function deleteTestUser(
  email: string,
  baseURL = "http://localhost:3000",
): Promise<void> {
  const orpc = createTestORPCClient(baseURL);

  // Retry механизм для удаления
  let lastError: Error | null = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await orpc.test.cleanup({ email });
      return; // Успешно удалили
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Ждем перед повторной попыткой
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // Не бросаем ошибку, только логируем - cleanup не должен ломать тесты
  console.warn(
    `Failed to delete test user ${email} after ${maxRetries} attempts:`,
    lastError?.message,
  );
}

/**
 * Авторизация созданного пользователя через UI
 */
export async function loginTestUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/signin");

  // Таб "Пароль" уже выбран по умолчанию, не нужно кликать
  // Ждем появления формы
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Заполняем форму
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill(password);

  // Отправляем форму
  await page.getByRole("button", { name: "Войти" }).click();

  // Ждем редиректа (может быть на / или на /orgs/.../workspaces/...)
  await page.waitForURL((url) => url.pathname !== "/auth/signin", {
    timeout: 30000,
  });

  // Ждем появления уведомления об успешном входе
  await page
    .getByText("Вход выполнен успешно!")
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {
      // Игнорируем если уведомление не появилось
    });
}

/**
 * Полная настройка теста: создание пользователя через oRPC + авторизация через UI
 * Использовать в beforeEach для быстрой подготовки тестов
 *
 * @example
 * ```typescript
 * let testUser: TestUser;
 *
 * test.beforeEach(async ({ page }) => {
 *   testUser = await setupAuthenticatedTest(page);
 * });
 *
 * test.afterEach(async () => {
 *   await deleteTestUser(testUser.email);
 * });
 * ```
 */
export async function setupAuthenticatedTest(
  page: Page,
  options?: {
    email?: string;
    password?: string;
    name?: string;
    orgName?: string;
    workspaceName?: string;
  },
): Promise<TestUser> {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  // Создаем пользователя через oRPC (быстро!)
  const testUser = await createTestUser(baseURL, options);

  // Авторизуемся через UI
  await loginTestUser(page, testUser.email, testUser.password);

  return testUser;
}

// Типизация для глобального объекта с cleanups
interface GlobalWithCleanups {
  __testCleanups?: Array<() => Promise<void>>;
}

/**
 * Хелпер для автоматической очистки тестового пользователя
 * Регистрирует cleanup который выполнится после теста
 */
export function registerTestUserCleanup(
  testUser: TestUser,
  baseURL = "http://localhost:3000",
): void {
  // Сохраняем email для cleanup
  const email = testUser.email;

  // Регистрируем cleanup через process.on для гарантированного выполнения
  const cleanup = async () => {
    try {
      await deleteTestUser(email, baseURL);
    } catch (error) {
      // Игнорируем ошибки cleanup чтобы не ломать тесты
      console.warn(`Failed to cleanup test user ${email}:`, error);
    }
  };

  // Добавляем в очередь cleanup
  const global = globalThis as GlobalWithCleanups;
  if (typeof global.__testCleanups === "undefined") {
    global.__testCleanups = [];
  }
  global.__testCleanups.push(cleanup);
}
