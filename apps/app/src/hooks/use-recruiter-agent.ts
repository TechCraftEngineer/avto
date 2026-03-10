"use client";

import { useCallback, useRef, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";

/**
 * Типы для AI-ассистента рекрутера
 */
export type RecruiterIntent =
  | "SEARCH_CANDIDATES"
  | "ANALYZE_VACANCY"
  | "GENERATE_CONTENT"
  | "COMMUNICATE"
  | "CONFIGURE_RULES"
  | "GENERAL_QUESTION";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: RecruiterIntent;
    actions?: string[];
  };
}

export interface ExecutedAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
  result: "success" | "failed" | "pending_approval";
  explanation: string;
  timestamp: Date;
  canUndo: boolean;
  undoDeadline?: Date;
}

export interface CandidateResult {
  id: string;
  name: string;
  fitScore: number;
  resumeScore: number;
  interviewScore?: number;
  whySelected: string;
  availability: {
    status: "immediate" | "2_weeks" | "1_month" | "unknown";
    confirmedAt?: Date;
  };
  riskFactors: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendation: {
    action: "invite" | "clarify" | "reject";
    reason: string;
    confidence: number;
  };
  contacts?: {
    telegram?: string;
    phone?: string;
    email?: string;
  };
}

export interface VacancyIssue {
  type: "salary" | "requirements" | "description" | "timing" | "competition";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
}

export interface VacancyRecommendation {
  type:
    | "change_title"
    | "adjust_salary"
    | "simplify_requirements"
    | "improve_description";
  title: string;
  description: string;
  expectedImpact: string;
  priority: number;
}

export interface VacancyAnalytics {
  vacancyId: string;
  metrics: {
    totalResponses: number;
    processedResponses: number;
    highScoreResponses: number;
    avgScore: number;
    conversionRate: number;
  };
  marketComparison: {
    salaryPercentile: number;
    requirementsComplexity: number;
    competitorVacancies: number;
    avgMarketSalary: number;
  };
  issues: VacancyIssue[];
  recommendations: VacancyRecommendation[];
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
}

export interface AgentTraceEntry {
  agent: string;
  decision: string;
  timestamp: Date;
}

export interface RecruiterAgentDocument {
  response: string;
  intent?: RecruiterIntent;
  actions: ExecutedAction[];
  recommendations?: Recommendation[];
  candidates?: CandidateResult[];
  analytics?: VacancyAnalytics;
  agentTrace: AgentTraceEntry[];
}

export type RecruiterAgentStatus = "idle" | "submitted" | "streaming" | "error";

export type StreamEventType =
  | "start"
  | "intent"
  | "action_start"
  | "action_progress"
  | "action_complete"
  | "text_chunk"
  | "complete"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  timestamp: Date;
  // Дополнительные поля в зависимости от типа
  message?: string;
  intent?: RecruiterIntent;
  confidence?: number;
  actionId?: string;
  actionType?: string;
  description?: string;
  progress?: number;
  action?: ExecutedAction;
  chunk?: string;
  isPartial?: boolean;
  output?: RecruiterAgentDocument;
  error?: string;
  code?: string;
}

interface UseRecruiterAgentOptions {
  vacancyId?: string;
  responseId?: string;
  onMessage?: (document: RecruiterAgentDocument) => void;
  onError?: (error: Error) => void;
  onFinish?: (document: RecruiterAgentDocument) => void;
  maxHistoryLength?: number;
}

interface UseRecruiterAgentReturn {
  document: RecruiterAgentDocument | null;
  history: ConversationMessage[];
  status: RecruiterAgentStatus;
  error: Error | null;
  currentAction: { id: string; type: string; progress: number } | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearHistory: () => void;
  setVacancyId: (id: string | undefined) => void;
}

const MAX_HISTORY_LENGTH = 20;

/**
 * Хук для работы с AI-ассистентом рекрутера
 *
 * Реализует:
 * - State management для document и history
 * - Streaming через tRPC subscription
 * - Error handling
 *
 * Requirements: 1.1, 1.5
 */
export function useRecruiterAgent({
  vacancyId: initialVacancyId,
  responseId,
  onMessage,
  onError,
  onFinish,
  maxHistoryLength = MAX_HISTORY_LENGTH,
}: UseRecruiterAgentOptions = {}): UseRecruiterAgentReturn {
  const { workspaceId } = useWorkspaceContext();

  const [document, setDocument] = useState<RecruiterAgentDocument | null>(null);
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [status, setStatus] = useState<RecruiterAgentStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [currentAction, setCurrentAction] = useState<{
    id: string;
    type: string;
    progress: number;
  } | null>(null);
  const [vacancyId, setVacancyId] = useState<string | undefined>(
    initialVacancyId,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const responseBufferRef = useRef<string>("");
  const actionsRef = useRef<ExecutedAction[]>([]);
  const traceRef = useRef<AgentTraceEntry[]>([]);

  /**
   * Отправить сообщение агенту
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !workspaceId) return;

      setError(null);
      setStatus("submitted");
      responseBufferRef.current = "";
      actionsRef.current = [];
      traceRef.current = [];

      // Захватываем историю до добавления нового сообщения
      const priorHistory = history.slice(-maxHistoryLength);

      // Добавляем сообщение пользователя в историю
      const userMessage: ConversationMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setHistory((prev) => {
        const updated = [...prev, userMessage];
        // Ограничиваем длину истории
        if (updated.length > maxHistoryLength) {
          return updated.slice(-maxHistoryLength);
        }
        return updated;
      });

      // Создаём AbortController для возможности отмены
      abortControllerRef.current = new AbortController();

      try {
        // Используем fetch для SSE streaming
        const response = await fetch("/api/trpc/recruiterAgent.chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            json: {
              workspaceId,
              message: content,
              vacancyId,
              responseId: responseId ?? undefined,
              conversationHistory: priorHistory,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message ||
              `HTTP error! status: ${response.status}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let buffer = "";
        let finalDocument: RecruiterAgentDocument | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            try {
              const jsonStr = trimmedLine.slice(6);
              if (jsonStr === "[DONE]") continue;

              const event = JSON.parse(jsonStr) as StreamEvent;

              // Восстанавливаем Date объекты
              if (event.timestamp) {
                event.timestamp = new Date(event.timestamp);
              }
              if (event.action?.timestamp) {
                event.action.timestamp = new Date(event.action.timestamp);
              }
              if (event.action?.undoDeadline) {
                event.action.undoDeadline = new Date(event.action.undoDeadline);
              }

              // Обрабатываем событие
              switch (event.type) {
                case "start":
                  // Начало обработки
                  break;

                case "intent":
                  // Определено намерение
                  setDocument((prev) => ({
                    response: prev?.response || "",
                    intent: event.intent,
                    actions: prev?.actions || [],
                    agentTrace: prev?.agentTrace || [],
                  }));
                  break;

                case "action_start":
                  if (event.actionId && event.actionType) {
                    setCurrentAction({
                      id: event.actionId,
                      type: event.actionType,
                      progress: 0,
                    });
                  }
                  break;

                case "action_progress":
                  if (event.actionId && event.progress !== undefined) {
                    setCurrentAction((prev) => {
                      if (prev && prev.id === event.actionId) {
                        return {
                          id: prev.id,
                          type: prev.type,
                          progress: event.progress ?? prev.progress,
                        };
                      }
                      return prev;
                    });
                  }
                  break;

                case "action_complete":
                  if (event.action) {
                    actionsRef.current.push(event.action);
                    setDocument((prev) => ({
                      response: prev?.response || "",
                      intent: prev?.intent,
                      actions: [...actionsRef.current],
                      agentTrace: prev?.agentTrace || [],
                    }));
                  }
                  setCurrentAction(null);
                  break;

                case "text_chunk":
                  if (event.chunk) {
                    responseBufferRef.current += event.chunk;
                    setDocument((prev) => ({
                      response: responseBufferRef.current,
                      intent: prev?.intent,
                      actions: prev?.actions || [],
                      agentTrace: prev?.agentTrace || [],
                    }));
                  }
                  break;

                case "complete":
                  if (event.output) {
                    finalDocument = event.output;
                    setDocument(finalDocument);
                  }
                  break;

                case "error":
                  throw new Error(event.error || "Unknown error");
              }
            } catch {
              // Игнорируем ошибки парсинга отдельных строк
              console.warn("Failed to parse stream line:", trimmedLine);
            }
          }
        }

        // Добавляем ответ ассистента в историю
        if (finalDocument) {
          const assistantMessage: ConversationMessage = {
            role: "assistant",
            content: finalDocument.response,
            timestamp: new Date(),
            metadata: {
              intent: finalDocument.intent,
              actions: finalDocument.actions.map((a) => a.type),
            },
          };

          setHistory((prev) => {
            const updated = [...prev, assistantMessage];
            if (updated.length > maxHistoryLength) {
              return updated.slice(-maxHistoryLength);
            }
            return updated;
          });

          onMessage?.(finalDocument);
          onFinish?.(finalDocument);
        }

        setStatus("idle");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setStatus("error");
        onError?.(errorObj);
      } finally {
        abortControllerRef.current = null;
        setCurrentAction(null);
      }
    },
    [
      workspaceId,
      vacancyId,
      responseId,
      history,
      maxHistoryLength,
      onMessage,
      onError,
      onFinish,
    ],
  );

  /**
   * Остановить текущий запрос
   */
  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("idle");
    setCurrentAction(null);
  }, []);

  /**
   * Очистить историю диалога
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setDocument(null);
    setError(null);
    setStatus("idle");
    setCurrentAction(null);
    responseBufferRef.current = "";
    actionsRef.current = [];
    traceRef.current = [];
  }, []);

  return {
    document,
    history,
    status,
    error,
    currentAction,
    sendMessage,
    stop,
    clearHistory,
    setVacancyId,
  };
}
