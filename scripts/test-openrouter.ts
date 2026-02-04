/**
 * Тестовый скрипт для проверки работы OpenRouter
 *
 * Использование:
 * 1. Установите OPENROUTER_API_KEY в .env
 * 2. Запустите: bun run scripts/test-openrouter.ts
 */

import { env } from "@qbs-autonaim/config";
import {
  getActualProvider,
  getAIModel,
  getAIModelName,
} from "@qbs-autonaim/lib/ai";
import { generateText } from "ai";

async function testOpenRouter() {
  console.log("🔍 Проверка конфигурации OpenRouter...\n");

  // Проверяем переменные окружения
  console.log("Переменные окружения:");
  console.log(`  AI_PROVIDER: ${env.AI_PROVIDER}`);
  console.log(`  AI_MODEL: ${env.AI_MODEL || "(по умолчанию)"}`);
  console.log(
    `  OPENROUTER_API_KEY: ${env.OPENROUTER_API_KEY ? "✓ установлен" : "✗ не установлен"}`,
  );
  console.log(
    `  OPENAI_API_KEY: ${env.OPENAI_API_KEY ? "✓ установлен" : "✗ не установлен"}`,
  );
  console.log(
    `  DEEPSEEK_API_KEY: ${env.DEEPSEEK_API_KEY ? "✓ установлен" : "✗ не установлен"}`,
  );
  console.log();

  // Проверяем фактический провайдер
  const actualProvider = getActualProvider();
  const modelName = getAIModelName();
  console.log(`Фактический провайдер: ${actualProvider}`);
  console.log(`Модель: ${modelName}`);
  console.log();

  // Тестируем генерацию текста
  console.log("🚀 Тестирование генерации текста...\n");

  try {
    const model = getAIModel();
    const startTime = Date.now();

    const result = await generateText({
      model,
      prompt:
        "Напиши короткое приветствие на русском языке (максимум 2 предложения)",
      maxTokens: 100,
    });

    const duration = Date.now() - startTime;

    console.log("✅ Успешно!");
    console.log(`Время выполнения: ${duration}ms`);
    console.log(`Ответ: ${result.text}`);
    console.log();

    if (result.usage) {
      console.log("Использование токенов:");
      console.log(`  Промпт: ${result.usage.promptTokens}`);
      console.log(`  Ответ: ${result.usage.completionTokens}`);
      console.log(`  Всего: ${result.usage.totalTokens}`);
    }
  } catch (error) {
    console.error("❌ Ошибка при генерации текста:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testOpenRouter().catch((error) => {
  console.error("❌ Критическая ошибка:");
  console.error(error);
  process.exit(1);
});
