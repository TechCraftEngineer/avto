import { generateText as aiGenerateText, type LanguageModel } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import { DEFAULT_MODEL_DEEPSEEK, DEFAULT_MODEL_OPENAI } from "./constants";
import { langfuse, openaiProvider } from "./providers";
import { getActualProvider, getAIModel, getAIModelName } from "./models";

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
    const canFallback =
      (actualProvider === "openai" && env.DEEPSEEK_API_KEY) ||
      (actualProvider === "deepseek" && env.OPENAI_API_KEY);

    if (canFallback) {
      const fallbackProvider =
        actualProvider === "openai" ? "deepseek" : "openai";
      const fallbackModel =
        fallbackProvider === "deepseek"
          ? deepseek(DEFAULT_MODEL_DEEPSEEK)
          : openaiProvider!(DEFAULT_MODEL_OPENAI);
      const fallbackModelName =
        fallbackProvider === "deepseek"
          ? DEFAULT_MODEL_DEEPSEEK
          : DEFAULT_MODEL_OPENAI;

      console.warn(
        `Ошибка ${actualProvider}, повторная попытка с ${fallbackProvider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace?.generation({
        name: `${generationName}-fallback`,
        model: fallbackModelName,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = await aiGenerateText({
          ...(aiOptions as unknown as Record<string, unknown>),
          model: fallbackModel,
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
