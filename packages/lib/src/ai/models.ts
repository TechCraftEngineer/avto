import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import type { LanguageModel } from "ai";
import {
  DEFAULT_MODEL_DEEPSEEK,
  DEFAULT_MODEL_LOCAL,
  DEFAULT_MODEL_OPENAI,
  DEFAULT_MODEL_OPENROUTER,
} from "./constants";
import { localProvider, openaiProvider, openrouterProvider } from "./providers";

/**
 * Определить фактически используемый провайдер с учётом fallback
 */
export function getActualProvider():
  | "openai"
  | "deepseek"
  | "openrouter"
  | "local" {
  const provider = env.AI_PROVIDER;

  // Проверяем доступность запрошенного провайдера
  if (provider === "openai" && !openaiProvider) {
    // OpenAI недоступен, ищем fallback
    if (env.OPENROUTER_API_KEY) return "openrouter";
    if (env.DEEPSEEK_API_KEY) return "deepseek";
    if (localProvider) return "local";
  }

  if (provider === "deepseek" && !env.DEEPSEEK_API_KEY) {
    // DeepSeek недоступен, ищем fallback
    if (env.OPENROUTER_API_KEY) return "openrouter";
    if (openaiProvider) return "openai";
    if (localProvider) return "local";
  }

  if (provider === "openrouter" && !openrouterProvider) {
    // OpenRouter недоступен, ищем fallback
    if (openaiProvider) return "openai";
    if (env.DEEPSEEK_API_KEY) return "deepseek";
    if (localProvider) return "local";
  }

  if (provider === "local" && !localProvider) {
    // Local недоступен, ищем fallback
    if (openaiProvider) return "openai";
    if (env.OPENROUTER_API_KEY) return "openrouter";
    if (env.DEEPSEEK_API_KEY) return "deepseek";
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
      if (!openaiProvider) {
        console.warn(
          "OpenAI провайдер недоступен (OPENAI_API_KEY не установлен). Ищу fallback...",
        );

        // Пробуем OpenRouter
        if (openrouterProvider) {
          console.warn("Переключаюсь на OpenRouter как fallback.");
          return openrouterProvider(env.AI_MODEL || DEFAULT_MODEL_OPENROUTER);
        }

        // Пробуем DeepSeek
        if (env.DEEPSEEK_API_KEY) {
          console.warn("Переключаюсь на DeepSeek как fallback.");
          return deepseek(DEFAULT_MODEL_DEEPSEEK);
        }

        // Пробуем Local
        if (localProvider) {
          console.warn("Переключаюсь на Local как fallback.");
          return localProvider(env.AI_MODEL || DEFAULT_MODEL_LOCAL);
        }

        throw new Error(
          "Ни один AI провайдер не доступен. Добавьте хотя бы один API ключ в .env файл.",
        );
      }
      return openaiProvider(model);
    }

    case "deepseek": {
      const model = env.AI_MODEL || DEFAULT_MODEL_DEEPSEEK;
      if (!env.DEEPSEEK_API_KEY) {
        console.warn("DEEPSEEK_API_KEY не установлен. Ищу fallback...");

        // Пробуем OpenRouter
        if (openrouterProvider) {
          console.warn("Переключаюсь на OpenRouter как fallback.");
          return openrouterProvider(env.AI_MODEL || DEFAULT_MODEL_OPENROUTER);
        }

        // Пробуем OpenAI
        if (openaiProvider) {
          console.warn("Переключаюсь на OpenAI как fallback.");
          return openaiProvider(DEFAULT_MODEL_OPENAI);
        }

        // Пробуем Local
        if (localProvider) {
          console.warn("Переключаюсь на Local как fallback.");
          return localProvider(env.AI_MODEL || DEFAULT_MODEL_LOCAL);
        }

        throw new Error(
          "Ни один AI провайдер не доступен. Добавьте хотя бы один API ключ в .env файл.",
        );
      }
      return deepseek(model);
    }

    case "openrouter": {
      const model = env.AI_MODEL || DEFAULT_MODEL_OPENROUTER;
      if (!openrouterProvider) {
        console.warn(
          "OpenRouter провайдер недоступен (OPENROUTER_API_KEY не установлен). Ищу fallback...",
        );

        // Пробуем OpenAI
        if (openaiProvider) {
          console.warn("Переключаюсь на OpenAI как fallback.");
          return openaiProvider(DEFAULT_MODEL_OPENAI);
        }

        // Пробуем DeepSeek
        if (env.DEEPSEEK_API_KEY) {
          console.warn("Переключаюсь на DeepSeek как fallback.");
          return deepseek(DEFAULT_MODEL_DEEPSEEK);
        }

        // Пробуем Local
        if (localProvider) {
          console.warn("Переключаюсь на Local как fallback.");
          return localProvider(env.AI_MODEL || DEFAULT_MODEL_LOCAL);
        }

        throw new Error(
          "Ни один AI провайдер не доступен. Добавьте хотя бы один API ключ в .env файл.",
        );
      }
      return openrouterProvider(model);
    }

    case "local": {
      const model = env.AI_MODEL || DEFAULT_MODEL_LOCAL;
      if (!localProvider) {
        console.warn(
          "Local провайдер недоступен (LOCAL_API_URL или LOCAL_API_KEY не установлены). Ищу fallback...",
        );

        // Пробуем OpenAI
        if (openaiProvider) {
          console.warn("Переключаюсь на OpenAI как fallback.");
          return openaiProvider(DEFAULT_MODEL_OPENAI);
        }

        // Пробуем OpenRouter
        if (openrouterProvider) {
          console.warn("Переключаюсь на OpenRouter как fallback.");
          return openrouterProvider(env.AI_MODEL || DEFAULT_MODEL_OPENROUTER);
        }

        // Пробуем DeepSeek
        if (env.DEEPSEEK_API_KEY) {
          console.warn("Переключаюсь на DeepSeek как fallback.");
          return deepseek(DEFAULT_MODEL_DEEPSEEK);
        }

        throw new Error(
          "Ни один AI провайдер не доступен. Добавьте хотя бы один API ключ в .env файл.",
        );
      }
      return localProvider(model);
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

  switch (actualProvider) {
    case "openai":
      return DEFAULT_MODEL_OPENAI;
    case "deepseek":
      return DEFAULT_MODEL_DEEPSEEK;
    case "openrouter":
      return DEFAULT_MODEL_OPENROUTER;
    case "local":
      return DEFAULT_MODEL_LOCAL;
    default:
      return DEFAULT_MODEL_DEEPSEEK;
  }
}

/**
 * Получить fallback модель в случае недоступности основной
 */
export function getFallbackModel(): LanguageModel {
  const actualProvider = getActualProvider();

  // Пробуем найти любой доступный провайдер
  if (actualProvider === "deepseek") {
    if (openrouterProvider) {
      console.warn(
        "[AI Client] DeepSeek недоступен, переключаюсь на OpenRouter как fallback",
      );
      return openrouterProvider(DEFAULT_MODEL_OPENROUTER);
    }
    if (openaiProvider) {
      console.warn(
        "[AI Client] DeepSeek недоступен, переключаюсь на OpenAI как fallback",
      );
      return openaiProvider(DEFAULT_MODEL_OPENAI);
    }
    if (localProvider) {
      console.warn(
        "[AI Client] DeepSeek недоступен, переключаюсь на Local как fallback",
      );
      return localProvider(DEFAULT_MODEL_LOCAL);
    }
  }

  if (actualProvider === "openai") {
    if (openrouterProvider) {
      console.warn(
        "[AI Client] OpenAI недоступен, переключаюсь на OpenRouter как fallback",
      );
      return openrouterProvider(DEFAULT_MODEL_OPENROUTER);
    }
    if (env.DEEPSEEK_API_KEY) {
      console.warn(
        "[AI Client] OpenAI недоступен, переключаюсь на DeepSeek как fallback",
      );
      return deepseek(DEFAULT_MODEL_DEEPSEEK);
    }
    if (localProvider) {
      console.warn(
        "[AI Client] OpenAI недоступен, переключаюсь на Local как fallback",
      );
      return localProvider(DEFAULT_MODEL_LOCAL);
    }
  }

  if (actualProvider === "openrouter") {
    if (env.DEEPSEEK_API_KEY) {
      console.warn(
        "[AI Client] OpenRouter недоступен, переключаюсь на DeepSeek как fallback",
      );
      return deepseek(DEFAULT_MODEL_DEEPSEEK);
    }
    if (openaiProvider) {
      console.warn(
        "[AI Client] OpenRouter недоступен, переключаюсь на OpenAI как fallback",
      );
      return openaiProvider(DEFAULT_MODEL_OPENAI);
    }
    if (localProvider) {
      console.warn(
        "[AI Client] OpenRouter недоступен, переключаюсь на Local как fallback",
      );
      return localProvider(DEFAULT_MODEL_LOCAL);
    }
  }

  if (actualProvider === "local") {
    if (openaiProvider) {
      console.warn(
        "[AI Client] Local недоступен, переключаюсь на OpenAI как fallback",
      );
      return openaiProvider(DEFAULT_MODEL_OPENAI);
    }
    if (openrouterProvider) {
      console.warn(
        "[AI Client] Local недоступен, переключаюсь на OpenRouter как fallback",
      );
      return openrouterProvider(DEFAULT_MODEL_OPENROUTER);
    }
    if (env.DEEPSEEK_API_KEY) {
      console.warn(
        "[AI Client] Local недоступен, переключаюсь на DeepSeek как fallback",
      );
      return deepseek(DEFAULT_MODEL_DEEPSEEK);
    }
  }

  // Нет доступной fallback модели
  throw new Error("Ни основная, ни fallback модель не доступны");
}
