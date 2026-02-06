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

type StreamOptionsV6 = StreamOptions & {
  activeTools?: Array<string>;
  onPrepareStep?: (stepNumber: number) => void | Promise<void>;
  onStepFinish?: (args: {
    stepNumber: number;
    toolCalls: Array<{
      toolName: string;
      args: Record<string, unknown>;
    }>;
  }) => void | Promise<void>;
  toolChoice?: "auto" | "required" | "none" | { type: "tool"; toolName: string };
  telemetryMetadata?: {
    entityType?: string;
    vacancyId?: string;
    gigId?: string;
    currentStage?: string;
  };
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
 * Попытка создать стрим с указанной моделью (версия v6 с расширенными параметрами)
 */
function tryStreamWithModelV6(
  modelToUse: ReturnType<typeof getAIModel>,
  options: StreamOptionsV6,
  isFallback = false,
  capturedSpan?: ReturnType<typeof trace.getSpan>,
) {
  try {
    // Фильтруем инструменты если указан activeTools
    let toolsToUse = options.tools;
    if (options.activeTools && options.activeTools.length > 0) {
      const activeToolsSet = new Set(options.activeTools);
      toolsToUse = Object.fromEntries(
        Object.entries(options.tools).filter(([toolName]) =>
          activeToolsSet.has(toolName),
        ),
      ) as ToolSet;
    }

    const streamResult = streamText({
      model: modelToUse,
      system: options.systemPrompt,
      messages: options.messages,
      tools: toolsToUse,
      ...(options.activeTools && options.activeTools.length > 0
        ? { activeTools: options.activeTools }
        : {}),
      ...(options.toolChoice ? { toolChoice: options.toolChoice } : {}),
      stopWhen: stepCountIs(25),
      experimental_transform: smoothStream({ chunking: "word" }),
      ...(options.onPrepareStep
        ? {
            onStepStart: async ({ stepNumber }: { stepNumber: number }) => {
              await options.onPrepareStep?.(stepNumber);
            },
          }
        : {}),
      ...(options.onStepFinish
        ? {
            onStepFinish: async ({ toolCalls }: { toolCalls: Array<{ toolName: string; args: unknown }> }) => {
              const stepNumber = 0; // AI SDK не предоставляет stepNumber в onStepFinish
              const formattedToolCalls = toolCalls.map((tc) => ({
                toolName: tc.toolName,
                args: tc.args as Record<string, unknown>,
              }));
              await options.onStepFinish?.({
                stepNumber,
                toolCalls: formattedToolCalls,
              });
            },
          }
        : {}),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "interview-chat-stream",
        metadata: {
          sessionId: options.sessionId,
          ...(options.telemetryMetadata || {}),
        },
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

/**
 * Выполнение стриминга с автоматическим fallback (версия v6 с расширенными параметрами)
 */
export function executeStreamWithFallbackV6(options: StreamOptionsV6) {
  const model = getAIModel();
  const activeContext = context.active();
  const span = trace.getSpan(activeContext);

  try {
    return tryStreamWithModelV6(model, options, false, span);
  } catch (error) {
    console.warn(
      "[Stream] Ошибка с основной моделью, переключаюсь на fallback:",
      error instanceof Error ? error.message : String(error),
    );

    try {
      const fallbackModel = getFallbackModel();
      const result = tryStreamWithModelV6(fallbackModel, options, true, span);

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
