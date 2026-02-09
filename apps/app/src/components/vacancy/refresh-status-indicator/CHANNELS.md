# Соответствие режимов и каналов

## Таблица режимов

| Режим | Канал | Топики | Event Type |
|-------|-------|--------|------------|
| `refresh` | `refreshVacancyResponsesChannel` | `progress`, `result` | `vacancy/responses.refresh` |
| `archived` | `syncArchivedResponsesChannel` | `status` ⚠️ | `vacancy/responses.sync-archived` |
| `screening` | `screenNewResponsesChannel` | `progress`, `result` | `response/screen.new` |
| `analyze` | `screenAllResponsesChannel` | `progress`, `result` | `response/screen.batch` |

## Структура событий

### Режим `refresh`
```typescript
// Топик: progress
{
  vacancyId: string;
  status: "started" | "processing" | "completed" | "error";
  message: string;
  currentPage?: number;
  totalSaved?: number;
  totalSkipped?: number;
}

// Топик: result
{
  vacancyId: string;
  success: boolean;
  newCount: number;
  totalResponses: number;
  error?: string;
}
```

### Режим `archived` ⚠️
```typescript
// Топик: status (не progress!)
{
  status: "started" | "processing" | "completed" | "error";
  message: string;
  vacancyId: string;
  syncedResponses?: number;
  newResponses?: number;
  vacancyTitle?: string;
}
```

### Режим `screening`
```typescript
// Топик: progress
{
  vacancyId: string;
  status: "started" | "processing" | "completed" | "error";
  message: string;
  total?: number;
  processed?: number;
  failed?: number;
}

// Топик: result
{
  vacancyId: string;
  success: boolean;
  total: number;
  processed: number;
  failed: number;
}
```

### Режим `analyze`
```typescript
// Топик: progress
{
  vacancyId: string;
  status: "started" | "processing" | "completed" | "error";
  message: string;
  total?: number;
  processed?: number;
  failed?: number;
}

// Топик: result
{
  vacancyId: string;
  success: boolean;
  total: number;
  processed: number;
  failed: number;
}
```

## Особенности

### Канал `archived`
⚠️ **Важно**: Этот канал использует топик `"status"` вместо `"progress"`, что отличается от остальных каналов.

Причина: исторически сложилось так, что канал был создан с другим именованием топика.

### Автозакрытие
- `refresh`: 10 секунд после завершения
- `archived`: 3 секунды после завершения
- `screening`: не закрывается автоматически
- `analyze`: не закрывается автоматически

### Инвалидация кэша
Все режимы инвалидируют:
1. `trpc.vacancy.responses.list` — при обработке и завершении
2. `trpc.vacancy.responses.getRefreshStatus` — при завершении (для отключения подписки)

## Обработка в коде

Хук `useRefreshSubscription` обрабатывает оба варианта топиков:
```typescript
const isProgressTopic = message.topic === "progress" || message.topic === "status";
const isResultTopic = message.topic === "result";
```

Это обеспечивает единообразную обработку всех режимов, несмотря на различия в именовании топиков.
