import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 6 : 1, // В CI - 6 воркеров для ускорения, локально - 1 для стабильности
  timeout: 90000, // Увеличиваем общий таймаут теста до 90 секунд
  maxFailures: process.env.CI ? 10 : undefined, // Останавливаем после 10 ошибок в CI
  globalSetup: "./global-setup.ts",
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ...(process.env.CI ? [["github"] as const] : []),
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000, // Увеличиваем таймаут для действий
    navigationTimeout: 60000, // Увеличиваем таймаут для навигации
    // Изоляция контекста для параллельных тестов
    storageState: undefined, // Каждый тест начинает с чистого состояния
  },

  projects: [
    // Быстрые UI тесты (без авторизации)
    {
      name: "ui-fast",
      testMatch: /.*\/(auth|accessibility)\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
      timeout: 30000, // Короткий таймаут для быстрых тестов
    },
    // Медленные E2E тесты (с авторизацией)
    {
      name: "e2e-slow",
      testMatch:
        /.*\/(account|organization|workspace|onboarding|sidebar)\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
      timeout: 90000, // Длинный таймаут для E2E тестов
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
    // {
    //   name: "mobile-chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
    // {
    //   name: "mobile-safari",
    //   use: { ...devices["iPhone 12"] },
    // },
  ],

  webServer: {
    command: "cd ../app && bun run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
