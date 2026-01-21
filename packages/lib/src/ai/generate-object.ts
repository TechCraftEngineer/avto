import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import {
  generateObject as aiGenerateObject,
  type GenerateObjectResult,
  type LanguageModel,
} from "ai";
import type { z } from "zod";
import { DEFAULT_MODEL_DEEPSEEK, DEFAULT_MODEL_OPENAI } from "./constants";
import { getActualProvider, getAIModel, getAIModelName } from "./models";
import { langfuse, openaiProvider } from "./providers";

export interface GenerateObjectOptions<T>
  extends Omit<Parameters<typeof aiGenerateObject>[0], "model" | "schema"> {
  model?: LanguageModel;
  schema: z.ZodType<T>;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  schemaName?: string;
  schemaDescription?: string;
}

export async function generateObject<T>(
  options: GenerateObjectOptions<T>,
): Promise<GenerateObjectResult<T>> {
  const {
    model = getAIModel(),
    schema,
    generationName,
    entityId,
    metadata = {},
    ...aiOptions
  } = options;

  const prompt = aiOptions.prompt || JSON.stringify(aiOptions.messages);
  const modelName = getAIModelName();

  const trace = langfuse.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace.generation({
    name: generationName,
    model: modelName,
    input: prompt,
    metadata,
  });

  try {
    const result = await aiGenerateObject({
      ...(aiOptions as unknown as Record<string, unknown>),
      model,
      schema,
    } as unknown as Parameters<typeof aiGenerateObject>[0]);

    generation.end({
      output: result.object,
    });

    trace.update({
      output: result.object,
    });

    return result as unknown as GenerateObjectResult<T>;
  } catch (error) {
    generation.end({
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
          : openaiProvider(DEFAULT_MODEL_OPENAI);
      const fallbackModelName =
        fallbackProvider === "deepseek"
          ? DEFAULT_MODEL_DEEPSEEK
          : DEFAULT_MODEL_OPENAI;

      console.warn(
        `Ошибка ${actualProvider}, повторная попытка с ${fallbackProvider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace.generation({
        name: `${generationName}-fallback`,
        model: fallbackModelName,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = await aiGenerateObject({
          ...(aiOptions as unknown as Record<string, unknown>),
          model: fallbackModel,
          schema,
        } as unknown as Parameters<typeof aiGenerateObject>[0]);

        fallbackGeneration.end({
          output: fallbackResult.object,
        });

        return fallbackResult as unknown as GenerateObjectResult<T>;
      } catch (fallbackError) {
        fallbackGeneration.end({
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
      await langfuse.flushAsync();
    } catch (flushError) {
      console.error("Не удалось сохранить трейс Langfuse", {
        generationName,
        traceId: trace.id,
        entityId,
        error: flushError,
      });
    }
  }
}
