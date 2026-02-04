# Интеграция Langfuse для трейсинга AI

## Как это работает

AI SDK 6 имеет встроенную поддержку телеметрии через `experimental_telemetry`. Langfuse автоматически собирает эти данные через свой SDK. Все вызовы агентов уже настроены на отправку трейсов.

## Настройка

### 1. Переменные окружения

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # опционально
```

### 2. Использование в Inngest функциях

```typescript
import { AgentFactory, flushTelemetry } from "@qbs-autonaim/ai";

export const myFunction = inngest.createFunction(
  { id: "my-function" },
  { event: "my.event" },
  async ({ event, step }) => {
    const result = await step.run("generate", async () => {
      const factory = new AgentFactory({ model: getAIModel() });
      const agent = factory.createSomeAgent();
      return await agent.execute(input, context);
    });

    // Отправляем все трейсы в Langfuse перед завершением
    await flushTelemetry();

    return result;
  }
);
```

### 3. Использование в API handlers

```typescript
import { flushTelemetry } from "@qbs-autonaim/ai";

export async function POST(req: Request) {
  try {
    const factory = new AgentFactory({ model: getAIModel() });
    const agent = factory.createSomeAgent();
    const result = await agent.execute(input, context);
    return Response.json(result);
  } finally {
    await flushTelemetry();
  }
}
```

### 4. Standalone скрипты

```typescript
import { flushTelemetry } from "@qbs-autonaim/ai";

async function main() {
  const factory = new AgentFactory({ model: getAIModel() });
  const agent = factory.createSomeAgent();
  const result = await agent.execute(input, context);
  
  // Обязательно отправляем трейсы перед выходом
  await flushTelemetry();
}

main().catch(console.error);
```

## Что отслеживается

Через `experimental_telemetry` в BaseAgent автоматически отправляются:

- Все вызовы AI моделей
- Токены (prompt, completion, total)
- Время выполнения
- Метаданные агентов:
  - `functionId` - имя агента
  - `agentType` - тип агента (detection, extraction, ranking и т.д.)
  - `modelProvider` - провайдер модели (openai, deepseek и т.д.)
  - `modelName` - название модели
  - `traceId` - кастомный ID трейса (если передан)
- Ошибки и таймауты

## Просмотр трейсов

1. Откройте https://cloud.langfuse.com
2. Выберите проект
3. Раздел "Traces"
4. Фильтруйте по:
   - `functionId` - имя агента
   - `agentType` - тип агента
   - `traceId` - кастомный ID

## Важно

- `flushTelemetry()` нужно вызывать в конце Inngest функций и standalone скриптов
- В долгоживущих процессах (серверы) трейсы отправляются автоматически
- Без переменных окружения трейсинг не работает, но агенты продолжают функционировать
