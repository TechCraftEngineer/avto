/**
 * Базовый класс для агентов на основе AI SDK 6 ToolLoopAgent
 */

import type { LanguageModel, ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
import type { Langfuse } from "langfuse";
import { type ZodType, z } from "zod";
import type { AgentType } from "./types";

/**
 * Схема для валидации полного ответа агента включая метаданные
 */
const FullResponseSchema = z.object({
  output: z.unknown(), // Будет валидироваться отдельно через outputSchema
  finishReason: z.enum([
    "stop",
    "length",
    "content-filter",
    "tool-calls",
    "error",
    "other",
    "unknown",
  ]),
  model: z
    .object({
      modelId: z.string().optional(),
    })
    .optional(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export interface AgentConfig {
  model: LanguageModel;
  maxSteps?: number;
  langfuse?: Langfuse | undefined;
  traceId?: string;
  tools?: ToolSet;
  modelProvider?: "openai" | "deepseek" | string;
  modelName?: string;
}

/**
 * Базовый класс для агентов с AI SDK 6 ToolLoopAgent
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected readonly name: string;
  protected readonly type: AgentType;
  protected readonly agent: ToolLoopAgent;
  protected readonly langfuse?: Langfuse;
  protected readonly traceId?: string;
  protected readonly outputSchema: ZodType<TOutput>;
  private readonly modelProvider?: string;
  private readonly modelName?: string;

  constructor(
    name: string,
    type: AgentType,
    instructions: string,
    outputSchema: ZodType<TOutput>,
    config: AgentConfig,
  ) {
    this.name = name;
    this.type = type;
    this.langfuse = config.langfuse;
    this.traceId = config.traceId;
    this.outputSchema = outputSchema;
    this.modelProvider = config.modelProvider;
    this.modelName = config.modelName;

    this.agent = new ToolLoopAgent({
      model: config.model,
      instructions,
      tools: config.tools,
      output: Output.object({
        schema: outputSchema,
      }),
      stopWhen: stepCountIs(config.maxSteps || 25),
    });
  }

  protected abstract validate(input: TInput): boolean;
  protected abstract buildPrompt(input: TInput, context: unknown): string;

  async execute(
    input: TInput,
    context: unknown,
  ): Promise<{ success: boolean; data?: TOutput; error?: string }> {
    if (!this.validate(input)) {
      console.error(`[${this.name}] Validation failed for input:`, {
        inputKeys: Object.keys(input as object),
        inputSample: JSON.stringify(input).substring(0, 500),
      });
      return { success: false, error: "Некорректные входные данные" };
    }

    const span = this.langfuse?.span({
      traceId: this.traceId,
      name: this.name,
      input,
      metadata: {
        agentType: this.type,
        modelProvider: this.modelProvider,
        modelName: this.modelName,
      },
    });

    try {
      const prompt = this.buildPrompt(input, context);

      // Логируем длину промпта и его содержимое для отладки
      console.log(`[${this.name}] Executing agent:`, {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4),
        promptPreview:
          prompt.substring(0, 500) + (prompt.length > 500 ? "..." : ""),
      });

      // Логируем скомпилированный prompt в Langfuse
      span?.update({
        input: {
          rawInput: input,
          compiledPrompt: prompt,
        },
      });

      const result = await this.agent.generate({ prompt });

      // Детальное логирование структуры result для отладки
      console.log(`[${this.name}] Raw result structure:`, {
        hasOutput: !!result.output,
        outputType: typeof result.output,
        outputKeys:
          result.output && typeof result.output === "object"
            ? Object.keys(result.output)
            : [],
        outputSample: JSON.stringify(result.output).substring(0, 1000),
        finishReason: result.finishReason,
      });

      // AI SDK 6 с Output.object() может возвращать объект с полем content
      // Извлекаем content перед валидацией, если он есть
      let outputData: unknown = result.output;

      // Проверяем, есть ли обёртка {content: {...}}
      if (
        outputData &&
        typeof outputData === "object" &&
        "content" in outputData &&
        Object.keys(outputData).length === 1
      ) {
        // Это обёртка от AI SDK, извлекаем content
        outputData = (outputData as { content: unknown }).content;
        console.log(`[${this.name}] Extracted content from AI SDK wrapper`);
      }

      console.log(`[${this.name}] Extracted output data:`, {
        wasWrapped: outputData !== result.output,
        outputDataType: typeof outputData,
        outputDataKeys:
          outputData && typeof outputData === "object"
            ? Object.keys(outputData)
            : [],
        outputDataSample: JSON.stringify(outputData).substring(0, 1000),
      });

      // Валидируем извлеченные данные против outputSchema
      const contentValidation = this.outputSchema.safeParse(outputData);

      if (!contentValidation.success) {
        console.error(`[${this.name}] Output validation failed:`, {
          errors: contentValidation.error.issues,
          rawOutput: result.output,
          extractedData: outputData,
          finishReason: result.finishReason,
        });
        throw new Error(
          `Не удалось валидировать выход агента: ${contentValidation.error.message}`,
        );
      }

      const validatedOutput = contentValidation.data;

      // Валидируем полный ответ включая метаданные
      const fullResponseValidation = FullResponseSchema.safeParse({
        output: result.output,
        finishReason: result.finishReason,
        model: (result as { model?: { modelId?: string } }).model,
        usage: (result as { usage?: unknown }).usage,
      });

      if (!fullResponseValidation.success) {
        console.error(`[${this.name}] Full response validation failed:`, {
          errors: fullResponseValidation.error.issues,
          rawResult: {
            finishReason: result.finishReason,
            model: (result as { model?: { modelId?: string } }).model,
            usage: (result as { usage?: unknown }).usage,
          },
        });
        throw new Error(
          `Не удалось валидировать полный ответ агента: ${fullResponseValidation.error.message}`,
        );
      }

      const validatedResponse = fullResponseValidation.data;

      span?.end({
        output: validatedOutput,
        metadata: {
          success: true,
          promptLength: prompt.length,
          finishReason: validatedResponse.finishReason,
          model: validatedResponse.model?.modelId,
          modelProvider: this.modelProvider,
          modelName: this.modelName,
          usage: validatedResponse.usage,
        },
      });

      return {
        success: true,
        data: validatedOutput,
      };
    } catch (error) {
      // Проверяем, является ли это ошибкой таймаута
      const isTimeout = error instanceof Error && error.name === "AbortError";

      const errorMessage = isTimeout
        ? "Превышено время ожидания выполнения агента"
        : error instanceof Error
          ? error.message
          : "Неизвестная ошибка";

      // Извлекаем детали ошибки API
      const apiError = error as {
        responseBody?: unknown;
        statusCode?: number;
        requestId?: string;
      };
      const responseBody = apiError?.responseBody;
      const statusCode = apiError?.statusCode;
      const requestId = apiError?.requestId;

      // Логируем детальную информацию об ошибке
      console.error(`[${this.name}] Agent execution failed:`, {
        error: errorMessage,
        isTimeout,
        stack: error instanceof Error ? error.stack : undefined,
        agentType: this.type,
        // API детали
        statusCode,
        requestId,
        responseBody: responseBody ? JSON.stringify(responseBody) : undefined,
        // Добавляем детали ошибки для отладки
        errorDetails:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                cause: error.cause,
              }
            : error,
      });

      span?.end({
        output: { error: errorMessage },
        metadata: {
          success: false,
          error: errorMessage,
          isTimeout,
          errorStack: error instanceof Error ? error.stack : undefined,
          statusCode,
          responseBody,
        },
      });

      return {
        success: false,
        error: isTimeout ? "TIMEOUT" : errorMessage,
      };
    }
  }

  getMetadata(): { name: string; type: AgentType } {
    return {
      name: this.name,
      type: this.type,
    };
  }
}
