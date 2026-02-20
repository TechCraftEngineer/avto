# Улучшения скрытности расширения

## Реализованные улучшения

### 1. ✅ Рандомизация задержек
**Файл**: `src/parsers/hh-employer/fetch-resume-html.ts`
- Базовая задержка: 2000ms
- Случайная добавка: 0-1500ms
- Итого: 2-3.5 секунды между запросами

```typescript
export function getRandomDelay(): number {
  return FETCH_DELAY_BASE_MS + Math.random() * FETCH_DELAY_RANDOM_MS;
}
```

### 2. ✅ Паузы после N операций
**Файл**: `src/utils/stealth.ts`
- Пауза 5-10 секунд после каждых 10-15 операций
- Имитирует "отдых" пользователя

```typescript
export async function checkAndPauseIfNeeded(
  currentIndex: number,
  pauseAfter: number = 10
): Promise<void> {
  if ((currentIndex + 1) % pauseAfter === 0) {
    const pauseMs = getRandomDelay(5000, 5000);
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}
```

### 3. ✅ Варьирование размера батчей
**Файл**: `src/content/hh-employer/import-improved.ts`
- Размер батча: 30-50 (вместо фиксированных 50)
- Случайный выбор для каждого импорта

```typescript
const batchSize = getRandomBatchSize(30, 50);
```

### 4. ✅ Имитация скроллинга
**Файл**: `src/utils/stealth.ts`
- 3-5 шагов скроллинга вниз
- Случайные задержки 300-800ms между шагами
- Пауза 500-1500ms внизу страницы

```typescript
export async function simulateScroll(): Promise<void> {
  const scrollSteps = 3 + Math.floor(Math.random() * 3);
  // ... плавный скроллинг с задержками
}
```

### 5. ✅ Ограничение массового импорта
**Файл**: `src/utils/stealth.ts`
- Максимум 100 резюме за раз
- Предупреждение пользователя при превышении

```typescript
export function checkImportLimit(count: number, maxLimit: number = 100): {
  allowed: boolean;
  message?: string;
}
```

### 6. ✅ Обработка rate limiting
**Файл**: `src/utils/stealth.ts`
- Функция для увеличения задержек при ошибке 429
- Увеличение в 2-3 раза

```typescript
export function handleRateLimitError(currentDelay: number): number {
  return currentDelay * (2 + Math.random());
}
```

## Новые файлы

### `src/utils/stealth.ts`
Утилиты для имитации человеческого поведения:
- `getRandomDelay()` - случайные задержки
- `getRandomBatchSize()` - случайный размер батча
- `simulateScroll()` - имитация скроллинга
- `checkAndPauseIfNeeded()` - паузы после N операций
- `handleRateLimitError()` - обработка 429
- `checkImportLimit()` - проверка лимитов

### `src/content/hh-employer/import-improved.ts`
Улучшенная версия импорта с использованием всех stealth-утилит

### `src/content/hh-employer/collectors-improved.ts`
Улучшенные коллекторы с имитацией скроллинга

## Как использовать

### Вариант 1: Постепенная миграция
Заменить импорты в существующих файлах:
```typescript
// Было
import { collectAllResponses } from "./collectors";

// Стало
import { collectAllResponses } from "./collectors-improved";
```

### Вариант 2: Полная замена
1. Переименовать `import.ts` → `import-old.ts`
2. Переименовать `import-improved.ts` → `import.ts`
3. То же с `collectors.ts`

## Текущие параметры

| Параметр | Старое значение | Новое значение |
|----------|----------------|----------------|
| Задержка между резюме | 800ms | 2000-3500ms |
| Задержка между страницами | 1500ms | 1500-3000ms |
| Размер батча | 50 | 30-50 |
| Пауза после N резюме | нет | 5-10 сек после 15 |
| Пауза после N вакансий | нет | 5-10 сек после 10 |
| Скроллинг | нет | да, 3-5 шагов |
| Лимит импорта | нет | 100 элементов |

## Дополнительные рекомендации

### 1. Мониторинг ошибок
Добавить логирование ошибок 429 и автоматическое увеличение задержек:

```typescript
try {
  // запрос
} catch (error) {
  if (error.status === 429) {
    currentDelay = handleRateLimitError(currentDelay);
    // повторить с увеличенной задержкой
  }
}
```

### 2. Проверка User-Agent
Убедиться, что расширение не добавляет подозрительные заголовки в запросы

### 3. Тестирование
- Протестировать импорт 50+ резюме
- Проверить, что паузы срабатывают
- Убедиться, что скроллинг работает

### 4. Настройка параметров
Можно сделать параметры конфигурируемыми через настройки расширения:
- Минимальная/максимальная задержка
- Частота пауз
- Размер батча
- Лимит импорта

## Риски и ограничения

1. **Время импорта увеличится** в 2-3 раза из-за задержек
2. **Пользователи могут жаловаться** на медленную работу
3. **Нужно тестирование** на реальных данных hh.ru
4. **Возможны ложные срабатывания** антибот-систем при больших объемах

## Следующие шаги

1. Протестировать новые функции
2. Заменить старые импорты на улучшенные
3. Добавить настройки для пользователей
4. Мониторить отзывы и ошибки
5. При необходимости увеличить задержки
