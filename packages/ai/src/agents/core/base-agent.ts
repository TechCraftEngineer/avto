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
  protected readonly langfuse?: Langfuse;
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
    this.langfuse = config.langfuse;
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

    // Логируем что уходит в агента
    console.log(`\n[${this.name}] 📋 Системные инструкции:`, this.instructions);
    console.log(`\n[${this.name}] 💬 Пользовательский промпт:`, prompt);

    // Создаем или получаем trace, затем создаем span
    let span: ReturnType<NonNullable<typeof this.langfuse>["span"]> | undefined;

    if (this.langfuse && this.traceId) {
      try {
        // Получаем trace по ID или создаем новый
        const trace = this.langfuse.trace({
          id: this.traceId,
          name: "agent-execution",
        });

        // Создаем span внутри trace
        span = trace.span({
          name: this.name,
          input: {
            rawInput: input,
            compiledPrompt: prompt,
          },
          metadata: {
            agentType: this.type,
            modelProvider: this.modelProvider,
            modelName: this.modelName,
            model: `${this.modelProvider}/${this.modelName}`,
            instructions: this.instructions,
            outputSchema: JSON.stringify(this.outputSchema._def, null, 2),
            inputSchema: this.inputSchema
              ? JSON.stringify(this.inputSchema._def, null, 2)
              : undefined,
          },
        });
      } catch (error) {
        console.warn(`[${this.name}] Failed to create Langfuse span:`, error);
      }
    }

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

      span?.end({
        output: {
          result: validatedOutput,
          finishReason: validatedResponse.finishReason,
        },
        metadata: {
          success: true,
          agentType: this.type,
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

      span?.end({
        output: {
          error: errorMessage,
        },
        metadata: {
          success: false,
          agentType: this.type,
          modelProvider: this.modelProvider,
          modelName: this.modelName,
          error: errorMessage,
          isTimeout,
          statusCode: apiError?.statusCode,
          requestId: apiError?.requestId,
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
