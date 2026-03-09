# Playwright E2E Tests

Автоматизированные end-to-end тесты для приложения.

## Структура тестов

```
tests/
├── auth/              # Тесты авторизации (быстрые, без auth)
├── account/           # Тесты настроек аккаунта (медленные, с auth)
├── organization/      # Тесты организаций (медленные, с auth)
├── workspace/         # Тесты воркспейсов (медленные, с auth)
├── onboarding/        # Тесты онбординга (медленные, с auth)
├── sidebar/           # Тесты сайдбара (медленные, с auth)
└── helpers/           # Вспомогательные функции
```

## Проекты

Тесты разделены на два проекта для оптимизации:

### `ui-fast` (30s timeout)
- Быстрые UI тесты без авторизации
- Включает: `auth/`, `accessibility/`
- Запуск: `bun test:fast`

### `e2e-slow` (90s timeout)
- Полные E2E тесты с авторизацией
- Включает: `account/`, `organization/`, `workspace/`, `onboarding/`, `sidebar/`
- Запуск: `bun test:slow`

## Запуск тестов

```bash
# Все тесты
bun test

# Только быстрые тесты
bun test:fast

# Только медленные E2E тесты
bun test:slow

# Тесты в UI режиме
bun test:ui

# Тесты с видимым браузером
bun test:headed

# Отладка конкретного теста
bun test:debug tests/auth/signin.spec.ts

# CI режим (оба проекта)
bun test:ci
```

## Настройка окружения

Тесты используют переменные из `.env` файла в корне проекта:

```env
BASE_URL=http://localhost:3000

# Для E2E тестов с авторизацией (account, workspace и др.)
# — при запуске с reuseExistingServer нужен dev-сервер с этой переменной
E2E_TEST_ENABLED=1
```

## Создание тестов

### Быстрые тесты (без авторизации)

```typescript
import { expect, test } from "@playwright/test";

test.describe("Страница входа", () => {
  test("отображает форму входа", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  });
});
```

### E2E тесты (с авторизацией)

```typescript
import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Настройки организации", () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.email);
  });

  test("отображает настройки", async ({ page }) => {
    await page.goto(`/orgs/${testUser.organization.slug}/settings`);
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
  });
});
```

## Оптимизация

### Изоляция тестов
- Каждый тест создает нового пользователя через TRPC API (быстро!)
- Авторизация через UI для реалистичности
- Автоматическая очистка после теста

### Параллелизм
- Локально: 1 воркер (стабильность)
- CI: 6 воркеров (скорость)
- Тесты изолированы и могут выполняться параллельно

### Таймауты
- Быстрые тесты: 30s
- E2E тесты: 90s
- Действия: 15s
- Навигация: 60s

## Отладка

### Просмотр отчета
```bash
bun report
```

### Trace Viewer
Трейсы сохраняются при первом retry:
```bash
npx playwright show-trace test-results/.../trace.zip
```

### Скриншоты и видео
- Скриншоты: только при ошибках
- Видео: сохраняются при ошибках

## Best Practices

1. **Используйте user-facing селекторы**
   ```typescript
   // ✅ Хорошо
   page.getByRole("button", { name: "Войти" })
   page.getByText("Добро пожаловать")
   page.getByLabel("Email")
   
   // ❌ Плохо
   page.locator(".btn-primary")
   page.locator("#login-button")
   ```

2. **Ждите элементы, не используйте sleep**
   ```typescript
   // ✅ Хорошо
   await expect(page.getByText("Успешно")).toBeVisible()
   
   // ❌ Плохо
   await page.waitForTimeout(1000)
   ```

3. **Изолируйте состояние**
   ```typescript
   // ✅ Хорошо - каждый тест создает своего пользователя
   test.beforeEach(async ({ page }) => {
     testUser = await setupAuthenticatedTest(page);
   });
   
   // ❌ Плохо - переиспользование пользователя между тестами
   ```

4. **Тестируйте критические пути**
   - Регистрация и вход
   - Создание организации/воркспейса
   - Основные функции приложения
   - Не тестируйте каждую кнопку

## Troubleshooting

### Тесты падают с "Project chromium not found"
Это означает, что используются старые результаты тестов. Удалите:
```bash
rm apps/playwright/test-results.json
```

### Тесты падают с FORBIDDEN или «тестовые эндпоинты недоступны»
Для E2E тестов нужно:
1. Запустить `bun dev:app` (app + app-server на 3000 и 7000)
2. Добавить `E2E_TEST_ENABLED=1` в `.env`
3. Проверить, что база данных настроена
4. Playwright подхватит уже запущенный сервер (reuseExistingServer)

### Internal Server Error при создании тестового пользователя
test.setup может вернуть 500 при проблемах с БД или auth. Проверьте:
- Доступность PostgreSQL (POSTGRES_URL в .env)
- Что app-server запущен (порт 7000)

### Тесты медленные
1. Используйте `test:fast` для быстрых тестов
2. Проверьте количество воркеров в конфиге
3. Убедитесь, что тесты изолированы

## CI/CD

В CI используется команда:
```bash
bun test:ci
```

Это запускает оба проекта (`ui-fast` и `e2e-slow`) с:
- 6 воркерами для параллелизма
- 2 retry при ошибках
- Остановкой после 10 ошибок
- GitHub reporter для аннотаций
