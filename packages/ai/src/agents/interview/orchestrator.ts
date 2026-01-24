/**
 * Оркестратор для голосовых интервью
 * Использует Orchestrator-Worker pattern из AI SDK workflows
 */

import { langfuse as globalLangfuse } from "@qbs-autonaim/lib/ai";
import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import { AgentFactory } from "../core/agent-factory";
import type { BaseAgentContext } from "../core/types";

export interface OrchestratorInput {
  questionNumber: number;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null; // Технические вопросы
  resumeLanguage?: string;
}

export interface OrchestratorOutput {
  analysis: string;
  shouldContinue: boolean;
  shouldEscalate?: boolean;
  escalationReason?: string;
  reason?: string;
  nextQuestion?: string;
  confidence?: number;
  waitingForCandidateResponse?: boolean;
  isSimpleAcknowledgment?: boolean;
  messageType?: string;
  agentTrace: Array<{
    agent: string;
    decision: string;
    timestamp: Date;
  }>;
}

export interface OrchestratorConfig {
  model: LanguageModel;
  maxSteps?: number;
  langfuse?: Langfuse | undefined;
}

/**
 * Получает или создает singleton инстанс Langfuse для оркестратора
 */
function getLangfuseInstance(): Langfuse | undefined {
  return globalLangfuse;
}

/**
 * Orchestrator-Worker pattern:
 * - Orchestrator координирует выполнение
 * - Workers (Detector, Analyzer, Interviewer) выполняют специализированные задачи
 */
export class InterviewOrchestrator {
  private model: LanguageModel;
  private maxSteps: number;
  private langfuse: Langfuse | undefined;

  constructor(config: OrchestratorConfig) {
    this.model = config.model;
    this.maxSteps = config.maxSteps || 10;
    this.langfuse = config.langfuse ?? getLangfuseInstance();
  }

  async execute(
    input: OrchestratorInput,
    context: BaseAgentContext,
  ): Promise<OrchestratorOutput> {
    const agentTrace: OrchestratorOutput["agentTrace"] = [];

    const trace = this.langfuse?.trace({
      name: "interview-orchestrator",
      userId: context.candidateId,
      metadata: {
        conversationId: context.candidateId, // Use candidateId as conversation identifier in Langfuse
        questionNumber: input.questionNumber,
        vacancyTitle: context.vacancyTitle,
        model: this.model,
      },
      input,
    });

    const traceId = trace?.id;

    // Инициализация агентов через фабрику
    const factory = new AgentFactory({
      model: this.model,
      langfuse: this.langfuse,
      traceId,
      maxSteps: this.maxSteps,
    });

    const contextAnalyzer = factory.createContextAnalyzer();
    const escalationDetector = factory.createEscalationDetector();
    const interviewer = factory.createInterviewer();

    try {
      // Получаем последнее сообщение кандидата из истории
      const lastCandidateMessage =
        context.conversationHistory
          .filter(
            (msg: { sender: string; content: string }) =>
              msg.sender === "CANDIDATE",
          )
          .slice(-1)[0]?.content || "";

      // ШАГ 1: Анализ контекста
      const contextResult = await contextAnalyzer.execute(
        {
          message: lastCandidateMessage,
          previousMessages: context.conversationHistory,
        },
        context,
      );

      agentTrace.push({
        agent: "ContextAnalyzer",
        decision: contextResult.success
          ? `type: ${contextResult.data?.messageType}`
          : "failed",
        timestamp: new Date(),
      });

      // Проверяем на простое подтверждение БЕЗ намерения продолжить
      if (
        contextResult.success &&
        contextResult.data?.messageType === "ACKNOWLEDGMENT" &&
        !contextResult.data.requiresResponse
      ) {
        return {
          analysis: "Простое подтверждение, ответ не требуется",
          shouldContinue: false,
          isSimpleAcknowledgment: true,
          messageType: "ACKNOWLEDGMENT",
          agentTrace,
        };
      }

      // CONTINUATION обрабатывается как обычный ответ - продолжаем интервью
      // (не возвращаем раньше времени)

      // ШАГ 2: Проверка эскалации (если это не простое подтверждение)
      const escalationCheck = await escalationDetector.execute(
        {
          message: lastCandidateMessage,
          conversationLength: context.conversationHistory.length,
        },
        context,
      );

      agentTrace.push({
        agent: "EscalationDetector",
        decision: escalationCheck.success
          ? `shouldEscalate: ${escalationCheck.data?.shouldEscalate}`
          : "failed",
        timestamp: new Date(),
      });

      if (escalationCheck.success && escalationCheck.data?.shouldEscalate) {
        return {
          analysis:
            escalationCheck.data.suggestedAction ||
            "Требуется эскалация к рекрутеру",
          shouldContinue: false,
          shouldEscalate: true,
          escalationReason: escalationCheck.data.reason,
          reason: escalationCheck.data.reason,
          agentTrace,
        };
      }

      // ШАГ 3: Генерация ответа через Interviewer (с retry)
      let interviewerResult:
        | Awaited<ReturnType<typeof interviewer.execute>>
        | undefined;
      let lastError: string | undefined;
      const maxRetries = 2;

      // Логируем входные данные для Interviewer
      console.log("[Orchestrator] Preparing Interviewer input:", {
        questionNumber: input.questionNumber,
        hasCustomOrganizationalQuestions: !!input.customOrganizationalQuestions,
        hasCustomInterviewQuestions: !!input.customInterviewQuestions,
        resumeLanguage: input.resumeLanguage,
        conversationHistoryLength: context.conversationHistory?.length,
      });

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        interviewerResult = await interviewer.execute(
          {
            ...input,
          },
          context,
        );

        if (interviewerResult.success && interviewerResult.data) {
          break; // Успешно выполнено
        }

        lastError = interviewerResult.error || "Unknown error";

        if (attempt < maxRetries) {
          console.warn(
            `[Orchestrator] Interviewer attempt ${attempt + 1} failed, retrying...`,
            {
              error: lastError,
            },
          );
          // Небольшая задержка перед повторной попыткой
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1)),
          );
        }
      }

      agentTrace.push({
        agent: "Interviewer",
        decision: interviewerResult?.success
          ? `shouldContinue: ${interviewerResult.data?.shouldContinue}`
          : `failed: ${lastError}`,
        timestamp: new Date(),
      });

      if (!interviewerResult?.success || !interviewerResult?.data) {
        throw new Error(
          `Interviewer agent failed after ${maxRetries + 1} attempts: ${lastError}`,
        );
      }

      return {
        ...interviewerResult.data,
        agentTrace,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown";

      console.error("[Orchestrator] Critical error:", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        agentTrace,
      });

      const output = {
        analysis:
          "Произошла техническая ошибка при обработке вашего ответа. Пожалуйста, попробуйте еще раз или свяжитесь с рекрутером напрямую.",
        shouldContinue: false,
        shouldEscalate: true,
        escalationReason: `Technical error: ${errorMessage}`,
        agentTrace,
      };

      trace?.update({
        output,
        metadata: {
          error: true,
          errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          model: this.model,
          agentTraceCount: agentTrace.length,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    }
  }
}
