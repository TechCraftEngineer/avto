# Телеметрия AI агентов

Модуль для отправки телеметрии AI агентов в Langfuse через OpenTelemetry.

## Фильтрация событий

Модуль автоматически фильтрует события, отправляя в Langfuse **только общение с AI моделями**:

### ✅ Что попадает в Langfuse:
- Вызовы AI SDK (`ai.*`)
- Генерация ответов (`generate`)
- Работа агентов (`agent`)
- Промпты и ответы моделей
- Метрики использования токенов

### ❌ Что НЕ попадает в Langfuse:
- События Inngest (`inngest.execution`)
- Шаги выполнения (`step`)
- Другие системные события

## Как это работает

`FilteredLangfuseSpanProcessor` наследуется от `LangfuseSpanProcessor` и переопределяет метод `onEnd()`, проверяя каждый span перед отправкой:

```typescript
const isAISpan =
  spanName.includes("ai.") ||           // AI SDK спаны
  spanName.includes("generate") ||      // Генерация
  spanName.includes("agent") ||         // Агенты
  attributes["ai.operationId"] ||       // AI операции
  attributes["ai.model.id"] ||          // Модели
  attributes["ai.prompt"] ||            // Промпты
  attributes["gen_ai.system"];          // OpenTelemetry AI conventions
```

Если span не связан с AI, он не передается в Langfuse.

## Настройка

Переменные окружения:
```env
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # опционально
```

## Использование

Телеметрия инициализируется автоматически при создании первого агента:

```typescript
const factory = new AgentFactory({
  model: getAIModel(),
  traceId: "unique-trace-id",
});

const agent = factory.createResponseScreening();
const result = await agent.execute(input, context);
```

Для Inngest функций используйте `flushTelemetry()` в конце:

```typescript
import { flushTelemetry } from "@qbs-autonaim/ai/telemetry";

export const myFunction = inngest.createFunction(
  { id: "my-function" },
  { event: "my/event" },
  async ({ event, step }) => {
    // ... ваш код
    
    await flushTelemetry(); // Отправить все трейсы
  }
);
```
