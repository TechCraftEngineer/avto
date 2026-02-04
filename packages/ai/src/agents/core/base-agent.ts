/**
 * Базовый класс для агентов на основе AI SDK 6 ToolLoopAgent
 */

import type { LanguageModel, ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
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
  traceId?: string;
  tools?: ToolSet;
  modelProvider?: "openai" | "deepseek" | "openrouter" | string;
  modelName?: string;
}

/**
 * Базовый класс для агентов с AI SDK 6 ToolLoopAgent
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected readonly name: string;
  protected readonly type: AgentType;
  protected readonly agent: ToolLoopAgent;
  protected readonly traceId?: string;
  protected readonly outputSchema: ZodType<TOutput>;
  protected readonly inputSchema?: ZodType<TInput>;
  protected readonly instructions: string;
  private readonly modelProvider?: string;
  private readonly modelName?: string;

  constructor(
    name: string,
    type: AgentType,
    instructions: string,
    outputSchema: ZodType<TOutput>,
    config: AgentConfig,
    inputSchema?: ZodType<TInput>,
  ) {
    this.name = name;
    this.type = type;
    this.instructions = instructions;
    this.traceId = config.traceId;
    this.outputSchema = outputSchema;
    this.inputSchema = inputSchema;
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

  protected validate(input: TInput): boolean {
    if (this.inputSchema) {
      const validationResult = this.inputSchema.safeParse(input);
      if (!validationResult.success) {
        console.error(
          `[${this.name}] Input validation failed:`,
          validationResult.error,
        );
        return false;
      }
    }
    return true;
  }

  protected abstract buildPrompt(input: TInput, context: unknown): string;

  async execute(
    input: TInput,
    context: unknown,
  ): Promise<{ success: boolean; data?: TOutput; error?: string }> {
    if (!this.validate(input)) {
      console.error(`[${this.name}] Validation failed for input`);
      return { success: false, error: "Некорректные входные данные" };
    }

    const prompt = this.buildPrompt(input, context);

    try {
      const result = await this.agent.generate({ prompt });

      // AI SDK 6 с Output.object() может возвращать объект с полем content
      let outputData: unknown = result.output;

      // Проверяем, есть ли обёртка {content: {...}}
      if (
        outputData &&
        typeof outputData === "object" &&
        "content" in outputData &&
        Object.keys(outputData).length === 1
      ) {
        outputData = (outputData as { content: unknown }).content;
      }

      // Валидируем извлеченные данные против outputSchema
      const contentValidation = this.outputSchema.safeParse(outputData);

      if (!contentValidation.success) {
        console.error(`[${this.name}] Output validation failed:`, {
          errors: contentValidation.error.issues,
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
        console.error(`[${this.name}] Full response validation failed`);
        throw new Error(
          `Не удалось валидировать полный ответ агента: ${fullResponseValidation.error.message}`,
        );
      }

      const validatedResponse = fullResponseValidation.data;

      return {
        success: true,
        data: validatedOutput,
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";

      const errorMessage = isTimeout
        ? "Превышено время ожидания выполнения агента"
        : error instanceof Error
          ? error.message
          : "Неизвестная ошибка";

      const apiError = error as {
        responseBody?: unknown;
        statusCode?: number;
        requestId?: string;
      };

      console.error(`[${this.name}] Agent execution failed:`, {
        error: errorMessage,
        isTimeout,
        statusCode: apiError?.statusCode,
        requestId: apiError?.requestId,
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
