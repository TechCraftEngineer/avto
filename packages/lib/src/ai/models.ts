import { env } from "@qbs-autonaim/config";
import { type LanguageModel } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { DEFAULT_MODEL_DEEPSEEK, DEFAULT_MODEL_OPENAI } from "./constants";
import { openaiProvider } from "./providers";

/**
 * Определить фактически используемый провайдер с учётом fallback
 */
export function getActualProvider(): "openai" | "deepseek" {
  const provider = env.AI_PROVIDER;
  if (provider === "openai" && !env.OPENAI_API_KEY && env.DEEPSEEK_API_KEY) {
    return "deepseek";
  }
  if (provider === "deepseek" && !env.DEEPSEEK_API_KEY && env.OPENAI_API_KEY) {
    return "openai";
  }
  return provider;
}

/**
 * Получить модель AI на основе конфигурации окружения с fallback
 */
export function getAIModel(): LanguageModel {
  const provider = env.AI_PROVIDER;

  switch (provider) {
    case "openai": {
      const model = env.AI_MODEL || DEFAULT_MODEL_OPENAI;
      if (!env.OPENAI_API_KEY) {
        console.warn(
          "OPENAI_API_KEY не установлен. Переключаюсь на DeepSeek как fallback.",
        );
        // Fallback на DeepSeek
        if (!env.DEEPSEEK_API_KEY) {
          throw new Error(
            "Ни OPENAI_API_KEY, ни DEEPSEEK_API_KEY не установлены. Добавьте хотя бы один в .env файл.",
          );
        }
        return deepseek(DEFAULT_MODEL_DEEPSEEK);
      }
      return openaiProvider(model);
    }
    case "deepseek": {
      const model = env.AI_MODEL || DEFAULT_MODEL_DEEPSEEK;
      if (!env.DEEPSEEK_API_KEY) {
        console.warn(
          "DEEPSEEK_API_KEY не установлен. Переключаюсь на OpenAI как fallback.",
        );
        // Fallback на OpenAI
        if (!env.OPENAI_API_KEY) {
          throw new Error(
            "Ни DEEPSEEK_API_KEY, ни OPENAI_API_KEY не установлены. Добавьте хотя бы один в .env файл.",
          );
        }
        return openaiProvider(DEFAULT_MODEL_OPENAI);
      }
      return deepseek(model);
    }
    default:
      throw new Error(`Неподдерживаемый AI провайдер: ${provider}`);
  }
}

/**
 * Получить название модели для логирования
 */
export function getAIModelName(provider?: string): string {
  const actualProvider = provider ?? env.AI_PROVIDER;
  const customModel = env.AI_MODEL;

  if (customModel) {
    return customModel;
  }

  return actualProvider === "openai"
    ? DEFAULT_MODEL_OPENAI
    : DEFAULT_MODEL_DEEPSEEK;
}

/**
 * Получить fallback модель в случае недоступности основной
 */
export function getFallbackModel(): LanguageModel {
  const actualProvider = getActualProvider();

  if (actualProvider === "deepseek" && env.OPENAI_API_KEY) {
    // DeepSeek недоступен, fallback на OpenAI
    console.warn(
      "[AI Client] DeepSeek недоступен, переключаюсь на OpenAI как fallback",
    );
    return openaiProvider(DEFAULT_MODEL_OPENAI);
  } else if (actualProvider === "openai" && env.DEEPSEEK_API_KEY) {
    // OpenAI недоступен, fallback на DeepSeek
    console.warn(
      "[AI Client] OpenAI недоступен, переключаюсь на DeepSeek как fallback",
    );
    return deepseek(DEFAULT_MODEL_DEEPSEEK);
  }

  // Нет доступной fallback модели
  throw new Error("Ни основная, ни fallback модель не доступны");
}
