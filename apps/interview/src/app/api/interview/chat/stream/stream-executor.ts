import { SpanStatusCode, trace } from "@opentelemetry/api";
import { getAIModel, getFallbackModel, streamText } from "@qbs-autonaim/lib/ai";
import type { ToolSet } from "ai";
import { smoothStream, stepCountIs } from "ai";

type StreamOptions = {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  tools: ToolSet;
  sessionId: string;
};

/**
 * Попытка создать стрим с указанной моделью
 */
async function tryStreamWithModel(
  modelToUse: ReturnType<typeof getAIModel>,
  options: StreamOptions,
  isFallback = false,
) {
  try {
    const streamResult = streamText({
      model: modelToUse,
      system: options.systemPrompt,
      messages: options.messages,
      tools: options.tools,
      stopWhen: stepCountIs(25),
      experimental_transform: smoothStream({ chunking: "word" }),
      experimental_telemetry: { isEnabled: true },
      generationName: "web-interview-response",
      entityId: options.sessionId,
      metadata: {
        sessionId: options.sessionId,
        isFallback,
      },
      onFinish: async () => {
        trace.getActiveSpan()?.end();
      },
    });

    // Проверяем работоспособность стрима
    const reader = streamResult.textStream.getReader();
    const firstChunk = await reader.read();

    if (firstChunk.done) {
      throw new Error("Поток сразу завершился");
    }

    // Создаём новый стрим с первым чанком
    const newStream = new ReadableStream({
      async start(controller) {
        if (firstChunk.value) {
          controller.enqueue(firstChunk.value);
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
      async cancel(reason) {
        try {
          await reader.cancel(reason);
          reader.releaseLock();
        } catch (cancelError) {
          console.warn("[Stream] Ошибка отмены:", cancelError);
        }
      },
    });

    return {
      ...streamResult,
      textStream: newStream as typeof streamResult.textStream,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "";

    const isTimeoutError =
      errorName === "TimeoutError" ||
      errorName === "AbortError" ||
      errorMessage.toLowerCase().includes("timeout") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.toLowerCase().includes("networkerror") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("network error");

    if (isTimeoutError) {
      console.warn(
        `[Stream] ${isFallback ? "Fallback " : ""}модель недоступна (таймаут/сеть): ${errorMessage}`,
      );
      const timeoutError = new Error(
        `Network or timeout error: ${errorMessage}`,
      );
      (timeoutError as Error & { isTransient?: boolean }).isTransient = true;
      throw timeoutError;
    }

    throw error;
  }
}

/**
 * Выполнение стриминга с автоматическим fallback
 */
export async function executeStreamWithFallback(options: StreamOptions) {
  const model = getAIModel();

  try {
    return await tryStreamWithModel(model, options, false);
  } catch (error) {
    console.warn(
      "[Stream] Ошибка с основной моделью, переключаюсь на fallback:",
      error instanceof Error ? error.message : String(error),
    );

    try {
      const fallbackModel = getFallbackModel();
      const result = await tryStreamWithModel(fallbackModel, options, true);

      console.log("[Stream] Успешно переключился на fallback модель");
      return result;
    } catch (fallbackError) {
      console.error(
        "[Stream] Fallback модель также недоступна:",
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError),
      );

      trace.getActiveSpan()?.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Основная: ${error instanceof Error ? error.message : String(error)}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      });
      trace.getActiveSpan()?.end();

      throw fallbackError;
    }
  }
}
