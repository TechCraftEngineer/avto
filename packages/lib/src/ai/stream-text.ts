import { streamText as aiStreamText, type LanguageModel } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { env } from "@qbs-autonaim/config";
import { DEFAULT_MODEL_DEEPSEEK, DEFAULT_MODEL_OPENAI } from "./constants";
import { langfuse, openaiProvider } from "./providers";
import { getActualProvider, getAIModel, getAIModelName } from "./models";
import { teeAsyncIterableStream } from "./utils";

export interface StreamTextOptions
  extends Omit<Parameters<typeof aiStreamText>[0], "model"> {
  model?: LanguageModel;
  generationName: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function streamText(
  options: StreamTextOptions,
): ReturnType<typeof aiStreamText> {
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

  let streamStarted = false;

  try {
    const result = aiStreamText({
      ...(aiOptions as unknown as Record<string, unknown>),
      model,
    } as unknown as Parameters<typeof aiStreamText>[0]);

    // Разделяем поток на два независимых клона
    const [loggingStream, callerStream] = teeAsyncIterableStream(
      result.textStream,
    );

    // Собираем текст из клона для логирования
    (async () => {
      try {
        let fullText = "";
        for await (const chunk of loggingStream) {
          streamStarted = true;
          fullText += chunk;
        }

        generation?.end({
          output: fullText,
        });

        trace?.update({
          output: fullText,
        });

        await langfuse?.flushAsync();
      } catch (streamError) {
        // Если стрим уже начался, не пытаемся переключиться на fallback
        if (streamStarted) {
          console.error("Ошибка во время стриминга (стрим уже начался):", {
            generationName,
            error:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
          });

          generation?.end({
            statusMessage:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
          });

          trace?.update({
            output: "Stream interrupted",
          });

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

          throw streamError;
        }

        // Fallback логика обрабатывается в основном catch блоке
        throw streamError;
      }
    })();

    // Возвращаем результат с нетронутым потоком для вызывающего кода
    return {
      ...result,
      textStream: callerStream,
    } as unknown as ReturnType<typeof aiStreamText>;
  } catch (error) {
    // Синхронная ошибка при создании стрима (до начала итерации)
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
          : openaiProvider?.(DEFAULT_MODEL_OPENAI);
      const fallbackModelName =
        fallbackProvider === "deepseek"
          ? DEFAULT_MODEL_DEEPSEEK
          : DEFAULT_MODEL_OPENAI;

      console.warn(
        `Ошибка ${actualProvider} при создании стрима, повторная попытка с ${fallbackProvider}:`,
        error instanceof Error ? error.message : String(error),
      );

      const fallbackGeneration = trace?.generation({
        name: `${generationName}-fallback`,
        model: fallbackModelName,
        input: prompt,
        metadata: { ...metadata, fallback: true },
      });

      try {
        const fallbackResult = aiStreamText({
          ...(aiOptions as unknown as Record<string, unknown>),
          model: fallbackModel,
        } as unknown as Parameters<typeof aiStreamText>[0]);

        // Разделяем fallback поток на два независимых клона
        const [fallbackLoggingStream, fallbackCallerStream] =
          teeAsyncIterableStream(fallbackResult.textStream);

        // Собираем текст из клона для логирования
        (async () => {
          try {
            let fullText = "";
            for await (const chunk of fallbackLoggingStream) {
              fullText += chunk;
            }

            fallbackGeneration?.end({
              output: fullText,
            });

            trace?.update({
              output: fullText,
            });

            await langfuse?.flushAsync();
          } catch (flushError) {
            console.error("Не удалось сохранить трейс Langfuse для fallback", {
              generationName,
              traceId: trace?.id,
              entityId,
              error: flushError,
            });
          }
        })();

        // Возвращаем fallback результат with untoched stream for caller
        return {
          ...fallbackResult,
          textStream: fallbackCallerStream,
        } as unknown as ReturnType<typeof aiStreamText>;
      } catch (fallbackError) {
        fallbackGeneration?.end({
          statusMessage:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });

        try {
          langfuse?.flushAsync().catch((flushError) => {
            console.error("Не удалось сохранить трейс Langfuse", {
              generationName,
              traceId: trace?.id,
              entityId,
              error: flushError,
            });
          });
        } catch {
          // Игнорируем ошибки flush
        }

        throw fallbackError;
      }
    }

    try {
      langfuse?.flushAsync().catch((flushError) => {
        console.error("Не удалось сохранить трейс Langfuse", {
          generationName,
          traceId: trace?.id,
          entityId,
          error: flushError,
        });
      });
    } catch {
      // Игнорируем ошибки flush
    }

    throw error;
  }
}
