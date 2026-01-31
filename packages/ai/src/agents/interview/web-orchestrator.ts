/**
 * Оркестратор для WEB интервью со стримингом
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType } from "../core/types";
import {
  buildContextAnalyzerPrompt,
  buildGigInterviewPrompt,
  buildVacancyInterviewPrompt,
} from "./prompts";
import type {
  GigData,
  InterviewVacancyData,
  WebInterviewContext,
} from "./types";

export type {
  ContextAnalysisResult,
  GigData,
  InterviewVacancyData,
  WebInterviewContext,
} from "./types";

export interface WebInterviewOrchestratorConfig extends AgentConfig {}

const contextAnalysisSchema = z.object({
  messageType: z.enum([
    "ANSWER",
    "QUESTION",
    "ACKNOWLEDGMENT",
    "OFF_TOPIC",
    "CONTINUATION",
  ]),
  requiresResponse: z.boolean(),
  shouldEscalate: z.boolean(),
  escalationReason: z.string().nullable(),
});

const webInterviewOrchestratorInputSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(
    z.object({
      sender: z.enum(["CANDIDATE", "BOT"]),
      content: z.string().min(1).max(1000),
    }),
  ),
});

export interface WebInterviewOrchestratorInput
  extends z.infer<typeof webInterviewOrchestratorInputSchema> {}

export type WebInterviewOrchestratorOutput = z.infer<
  typeof contextAnalysisSchema
>;

export class WebInterviewOrchestrator extends BaseAgent<
  WebInterviewOrchestratorInput,
  WebInterviewOrchestratorOutput
> {
  constructor(config: WebInterviewOrchestratorConfig) {
    const instructions = `Ты — эксперт по анализу контекста сообщений в рамках WEB интервью.
Твоя задача:
1. Определить тип последнего сообщения кандидата
2. Понять, требуется ли ответ от бота
3. Определить, нужно ли эскалировать к живому рекрутеру

КРИТЕРИИ ОПРЕДЕЛЕНИЯ ТИПА СООБЩЕНИЯ:
- ANSWER: Кандидат отвечает на вопрос
- QUESTION: Кандидат задает вопрос
- ACKNOWLEDGMENT: Кандидат подтверждает понял (например, "ок", "понятно")
- OFF_TOPIC: Сообщение не по теме интервью
- CONTINUATION: Кандидат продолжает свой ответ

КРИТЕРИИ ЭСКАЛАЦИИ:
- Запрос на общение с живым человеком
- Агрессивное или неадекватное поведение
- Сложные вопросы о компании/условиях
- Технические проблемы
- Жалобы или конфликтные ситуации`;

    super(
      "WebInterviewOrchestrator",
      AgentType.ORCHESTRATOR,
      instructions,
      contextAnalysisSchema,
      config,
      webInterviewOrchestratorInputSchema,
    );
  }

  protected validate(input: WebInterviewOrchestratorInput): boolean {
    return !!input.message && Array.isArray(input.history);
  }

  protected buildPrompt(
    input: WebInterviewOrchestratorInput,
    _context: unknown,
  ): string {
    return buildContextAnalyzerPrompt(input.message, input.history);
  }

  buildVacancyPrompt(
    vacancy: InterviewVacancyData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildVacancyInterviewPrompt(vacancy, context, isFirstResponse);
  }

  buildGigPrompt(
    gig: GigData,
    context: WebInterviewContext,
    isFirstResponse: boolean,
  ): string {
    return buildGigInterviewPrompt(gig, context, isFirstResponse);
  }
}
