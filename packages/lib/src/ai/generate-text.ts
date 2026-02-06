import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import { generateText as aiGenerateText, type LanguageModel } from "ai";
import {
  DEFAULT_MODEL_DEEPSEEK,
  DEFAULT_MODEL_OPENAI,
  DEFAULT_MODEL_OPENROUTER,
} from "./constants";
import { getActualProvider, getAIModel, getAIModelName } from "./models";
import { langfuse, openaiProvider, openrouterProvider } from "./providers";

export interface GenerateTextOptions
  extends Omit<Parameters<typeof aiGenerateText>[0], "model"> {
  model?: LanguageModel;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function generateText(
  options: GenerateTextOptions,
): Promise<Awaited<ReturnType<typeof aiGenerateText>>> {
  const {
    model = getAIModel(),
    generationName,
    entityId,
    metadata = {},
    ...aiOptions
  } = options;

  const prompt = aiOptions.prompt || JSON.stringify(aiOptions.messages);
  const modelName = getAIModelName();

  const trace = langfuse?.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace?.generation({
    name: generationName,
    model: modelName,
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateText({
      ...(aiOptions as unknown as Record<string, unknown>),
      model,
    } as unknown as Parameters<typeof aiGenerateText>[0]);

    generation?.end({
      output: result.text,
    });

    trace?.update({
      output: result.text,
    });

    return result;
  } catch (error) {
    generation?.end({
      statusMessage: error instanceof Error ? error.message : String(error),
    });

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
        `Ошибка ${actualProvider}, повторная попытка с ${fallback.provider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace?.generation({
        name: `${generationName}-fallback`,
        model: fallback.modelName,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = await aiGenerateText({
          ...(aiOptions as unknown as Record<string, unknown>),
          model: fallback.model,
        } as unknown as Parameters<typeof aiGenerateText>[0]);

        fallbackGeneration?.end({
          output: fallbackResult.text,
        });

        return fallbackResult;
      } catch (fallbackError) {
        fallbackGeneration?.end({
          statusMessage:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });
        throw fallbackError;
      }
    }

    throw error;
  } finally {
    try {
      await langfuse?.flushAsync();
    } catch (flushError) {
      console.error("Не удалось сохранить трейс Langfuse", {
        generationName,
        traceId: trace?.id,
        entityId,
        error: flushError,
      });
    }
  }
}
