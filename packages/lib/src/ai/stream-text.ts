import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import { streamText as aiStreamText, type LanguageModel } from "ai";
import {
  DEFAULT_MODEL_DEEPSEEK,
  DEFAULT_MODEL_OPENAI,
  DEFAULT_MODEL_OPENROUTER,
} from "./constants";
import { getActualProvider, getAIModel } from "./models";
import { openaiProvider, openrouterProvider } from "./providers";

export interface StreamTextOptions
  extends Omit<Parameters<typeof aiStreamText>[0], "model"> {
  model?: LanguageModel;
}

export function streamText(
  options: StreamTextOptions,
): ReturnType<typeof aiStreamText> {
  const { model = getAIModel(), ...aiOptions } = options;

  try {
    return aiStreamText({
      ...(aiOptions as unknown as Record<string, unknown>),
      model,
      experimental_telemetry: { isEnabled: true },
    } as unknown as Parameters<typeof aiStreamText>[0]);
  } catch (error) {
    // Retry с fallback моделью
    const actualProvider = getActualProvider();

    // Определяем доступные fallback провайдеры
    const availableFallbacks: Array<{
      provider: "openai" | "deepseek" | "openrouter" | "local";
      model: LanguageModel;
      modelName: string;
    }> = [];

    if (actualProvider !== "openai" && openaiProvider) {
      availableFallbacks.push({
        provider: "openai",
        model: openaiProvider(DEFAULT_MODEL_OPENAI),
        modelName: DEFAULT_MODEL_OPENAI,
      });
    }

    if (actualProvider !== "deepseek" && env.DEEPSEEK_API_KEY) {
      availableFallbacks.push({
        provider: "deepseek",
        model: deepseek(DEFAULT_MODEL_DEEPSEEK),
        modelName: DEFAULT_MODEL_DEEPSEEK,
      });
    }

    if (actualProvider !== "openrouter" && openrouterProvider) {
      availableFallbacks.push({
        provider: "openrouter",
        model: openrouterProvider(DEFAULT_MODEL_OPENROUTER),
        modelName: DEFAULT_MODEL_OPENROUTER,
      });
    }

    if (availableFallbacks.length > 0) {
      const fallback = availableFallbacks[0];
      if (!fallback) {
        throw error;
      }

      console.warn(
        `Ошибка ${actualProvider} при создании стрима, повторная попытка с ${fallback.provider}:`,
        error instanceof Error ? error.message : String(error),
      );

      try {
        return aiStreamText({
          ...(aiOptions as unknown as Record<string, unknown>),
          model: fallback.model,
          experimental_telemetry: { isEnabled: true },
        } as unknown as Parameters<typeof aiStreamText>[0]);
      } catch (fallbackError) {
        console.error(
          `Fallback модель ${fallback.provider} также недоступна:`,
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
        );
        throw fallbackError;
      }
    }

    throw error;
  }
}
