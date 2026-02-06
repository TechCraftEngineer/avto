import { context, SpanStatusCode, trace } from "@opentelemetry/api";
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
function tryStreamWithModel(
  modelToUse: ReturnType<typeof getAIModel>,
  options: StreamOptions,
  isFallback = false,
  capturedSpan?: ReturnType<typeof trace.getSpan>,
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
        capturedSpan?.end();
      },
    });

    return streamResult;
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
export function executeStreamWithFallback(options: StreamOptions) {
  const model = getAIModel();
  const activeContext = context.active();
  const span = trace.getSpan(activeContext);

  try {
    return tryStreamWithModel(model, options, false, span);
  } catch (error) {
    console.warn(
      "[Stream] Ошибка с основной моделью, переключаюсь на fallback:",
      error instanceof Error ? error.message : String(error),
    );

    try {
      const fallbackModel = getFallbackModel();
      const result = tryStreamWithModel(fallbackModel, options, true, span);

      console.log("[Stream] Успешно переключился на fallback модель");
      return result;
    } catch (fallbackError) {
      console.error(
        "[Stream] Fallback модель также недоступна:",
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError),
      );

      // Создаём комбинированную ошибку с обоими стеками
      const primaryMsg = error instanceof Error ? error.message : String(error);
      const fallbackMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);

      const combinedError = new Error(
        `Основная модель: ${primaryMsg}; Fallback модель: ${fallbackMsg}`,
      );
      combinedError.name = "StreamExecutionError";
      (
        combinedError as Error & {
          primaryError?: unknown;
          fallbackError?: unknown;
        }
      ).primaryError = error;
      (
        combinedError as Error & {
          primaryError?: unknown;
          fallbackError?: unknown;
        }
      ).fallbackError = fallbackError;

      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: combinedError.message,
      });

      throw combinedError;
    }
  }
}
