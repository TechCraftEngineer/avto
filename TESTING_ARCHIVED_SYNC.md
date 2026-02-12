# Тесты для синхронизации архивных откликов

Этот документ описывает тесты для функционала синхронизации архивных откликов с HeadHunter.

## Структура тестов

### Бэкенд тесты

#### 1. API тесты (tRPC)
**Файл:** `packages/api/src/routers/freelance-platforms/other/sync-archived-vacancy-responses.test.ts`

Тестирует:
- Проверку доступа к workspace
- Валидацию существования вакансии
- Проверку наличия публикации на HH.ru
- Валидацию externalId или URL
- Успешный запуск синхронизации

#### 2. Inngest функции
**Файл:** `packages/jobs/src/inngest/functions/vacancy/sync-archived-responses.test.ts`

Тестирует:
- Валидацию входных данных
- Проверку принадлежности вакансии к workspace
- Публикацию progress сообщений
- Обработку ошибок парсинга
- Обновление lastSyncedAt

#### 3. Парсеры
**Файл:** `packages/jobs-parsers/src/parsers/hh/parsers/response/archived-response-parser.test.ts`

Тестирует:
- Парсинг откликов с архивной вакансии
- Обработку пустого списка откликов
- Учет лимитов тарифного плана
- Обработку ошибок парсинга даты
- Остановку парсинга при дубликатах
- Вызов onProgress callback

#### 4. Функции получения списка
**Файл:** `packages/jobs-parsers/src/functions/vacancy/fetch-archived-list.test.ts`

Тестирует:
- Валидацию входных данных
- Публикацию progress сообщений
- Проверку уже загруженных вакансий
- Установку флага isImported
- Обработку ошибок подключения
- Фильтрацию вакансий без externalId

#### 5. Функции импорта
**Файл:** `packages/jobs-parsers/src/functions/vacancy/import-archived.test.ts`

Тестирует:
- Валидацию входных данных
- Публикацию progress сообщений
- Отслеживание прогресса импорта
- Публикацию result сообщения
- Обработку частичных ошибок

### Фронтенд тесты

#### 1. Хук подписки
**Файл:** `apps/app/src/components/vacancy/components/responses/hooks/use-sync-archived-subscription.test.ts`

Тестирует:
- Обработку progress сообщений
- Обработку result сообщений
- Обработку ошибок
- Валидацию данных realtime
- Отключение при enabled=false

#### 2. Хук состояния
**Файл:** `apps/app/src/components/vacancy/components/responses/hooks/use-sync-archived-state.test.ts`

Тестирует:
- Инициализацию с idle статусом
- Открытие/закрытие диалога
- Установку loading статуса
- Вызов onSyncArchived
- Обработку ошибок
- Сброс состояния

#### 3. Компонент выбора вакансий
**Файл:** `apps/app/src/components/vacancies/components/archived-vacancies-selector/archived-vacancies-selector.test.tsx`

Тестирует:
- Отображение списка вакансий
- Отображение статистики
- Фильтрацию по поиску
- Фильтрацию по табам
- Выбор/снятие выбора вакансий
- Выбор всех вакансий
- Выбор только новых вакансий
- Вызов onSelect/onCancel
- Сортировку
- Обработку ошибок
- Состояние загрузки
- Пустой список

### E2E тесты (Playwright)

#### Синхронизация архивных откликов
**Файл:** `apps/playwright/tests/vacancy/sync-archived-responses.spec.ts`

Тестирует:
- Отображение кнопки «Загрузить архивные отклики» на странице откликов архивной вакансии
- Текст для архивной вакансии без откликов
- Открытие диалога подтверждения при клике
- Закрытие диалога без запуска
- Запуск синхронизации при подтверждении

**Запуск:**
```bash
cd apps/playwright && bunx playwright test tests/vacancy/sync-archived-responses.spec.ts
```

## Запуск тестов

### Все тесты
```bash
bun test
```

### Только бэкенд тесты
```bash
# API тесты
bun test packages/api/src/routers/freelance-platforms/other/sync-archived-vacancy-responses.test.ts

# Inngest функции
bun test packages/jobs/src/inngest/functions/vacancy/sync-archived-responses.test.ts

# Парсеры
bun test packages/jobs-parsers/src/parsers/hh/parsers/response/archived-response-parser.test.ts

# Функции получения списка
bun test packages/jobs-parsers/src/functions/vacancy/fetch-archived-list.test.ts

# Функции импорта
bun test packages/jobs-parsers/src/functions/vacancy/import-archived.test.ts
```

### Только фронтенд тесты
```bash
# Хук подписки
bun test apps/app/src/components/vacancy/components/responses/hooks/use-sync-archived-subscription.test.ts

# Хук состояния
bun test apps/app/src/components/vacancy/components/responses/hooks/use-sync-archived-state.test.ts

# Компонент выбора вакансий
bun test apps/app/src/components/vacancies/components/archived-vacancies-selector/archived-vacancies-selector.test.tsx
```

### Тесты с покрытием
```bash
bun test --coverage
```

### Тесты в watch режиме
```bash
bun test --watch
```

## Известные проблемы и глюки

### 1. Дубликаты откликов
**Проблема:** При повторной синхронизации могут создаваться дубликаты откликов.

**Тесты:**
- `archived-response-parser.test.ts` - проверяет остановку парсинга при дубликатах
- `sync-archived-responses.test.ts` - проверяет обновление lastSyncedAt

**Решение:** Проверка существующих откликов по resumeId перед сохранением.

### 2. Лимиты тарифного плана
**Проблема:** Не всегда корректно применяются лимиты на количество откликов.

**Тесты:**
- `archived-response-parser.test.ts` - проверяет учет лимитов тарифного плана

**Решение:** Явная проверка лимита перед обработкой каждого отклика.

### 3. Ошибки парсинга даты
**Проблема:** Некорректный формат даты отклика может привести к ошибкам.

**Тесты:**
- `archived-response-parser.test.ts` - проверяет обработку ошибок парсинга даты

**Решение:** Обработка ошибок парсинга и логирование проблемных случаев.

### 4. Отсутствие externalId
**Проблема:** Некоторые вакансии могут не иметь externalId.

**Тесты:**
- `sync-archived-vacancy-responses.test.ts` - проверяет наличие externalId или URL
- `fetch-archived-list.test.ts` - проверяет фильтрацию вакансий без externalId

**Решение:** Валидация наличия externalId или URL перед синхронизацией.

### 5. Состояние загрузки на фронтенде
**Проблема:** Состояние загрузки может зависнуть при ошибках.

**Тесты:**
- `use-sync-archived-state.test.ts` - проверяет обработку ошибок и сброс состояния
- `archived-vacancies-selector.test.tsx` - проверяет состояние загрузки

**Решение:** Правильная обработка ошибок и сброс состояния при закрытии диалога.

### 6. Realtime подписки
**Проблема:** Подписки могут не отписываться при размонтировании компонента.

**Тесты:**
- `use-sync-archived-subscription.test.ts` - проверяет отключение при enabled=false

**Решение:** Использование enabled флага для управления подпиской.

### 7. Частичные ошибки импорта
**Проблема:** При импорте нескольких вакансий, ошибка в одной может прервать весь процесс.

**Тесты:**
- `import-archived.test.ts` - проверяет обработку частичных ошибок

**Решение:** Обработка ошибок для каждой вакансии отдельно и продолжение импорта.

## Рекомендации по тестированию

1. **Запускайте тесты перед коммитом:**
   ```bash
   bun test
   ```

2. **Проверяйте покрытие кода:**
   ```bash
   bun test --coverage
   ```
   Целевое покрытие: минимум 80%

3. **Используйте watch режим при разработке:**
   ```bash
   bun test --watch
   ```

4. **Тестируйте граничные случаи:**
   - Пустые списки
   - Большие объемы данных
   - Сетевые ошибки
   - Невалидные данные

5. **Проверяйте интеграцию:**
   - Полный поток от API до UI
   - Realtime обновления
   - Обработка ошибок на всех уровнях

## Дополнительные ресурсы

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)

## Контрибьюция

При добавлении нового функционала:
1. Напишите тесты до реализации (TDD)
2. Убедитесь что все тесты проходят
3. Проверьте покрытие кода
4. Обновите этот документ при необходимости
