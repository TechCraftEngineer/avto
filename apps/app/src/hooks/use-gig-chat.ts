"use client";

import { useCallback, useRef, useState } from "react";

export interface GigDocument {
  title?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string;
  budgetRange?: string;
  timeline?: string;
}

export interface UseGigChatOptions {
  workspaceId: string;
  initialDocument?: GigDocument;
  apiEndpoint?: string;
  timeout?: number;
  /** Вызывается при каждом streaming-обновлении document */
  onDocumentUpdate?: (document: GigDocument) => void;
}

export type GigChatStatus = "idle" | "loading" | "streaming" | "error";

export interface UseGigChatReturn {
  document: GigDocument;
  quickReplies: string[];
  status: GigChatStatus;
  error: string | null;
  sendMessage: (
    message: string,
    currentDocument?: GigDocument,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ) => Promise<GigDocument | null>;
}

/**
 * Streaming hook для генерации ТЗ разового задания через LLM.
 * Каждый вызов sendMessage стримит ответ и постепенно обновляет document.
 */
export function useGigChat({
  workspaceId,
  initialDocument = {},
  apiEndpoint = "/api/gig/chat-generate",
  timeout = 60000,
  onDocumentUpdate,
}: UseGigChatOptions): UseGigChatReturn {
  const [document, setDocument] = useState<GigDocument>(initialDocument);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [status, setStatus] = useState<GigChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      currentDocument?: GigDocument,
      conversationHistory?: Array<{
        role: "user" | "assistant";
        content: string;
      }>,
    ): Promise<GigDocument | null> => {
      if (!content.trim()) return null;

      setError(null);
      setStatus("loading");

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            message: content,
            currentDocument: currentDocument ?? document,
            conversationHistory: conversationHistory ?? [],
          }),
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: unknown;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}` };
          }
          const errMsg =
            typeof errorData === "object" &&
            errorData &&
            "error" in errorData &&
            typeof (errorData as { error?: unknown }).error === "string"
              ? (errorData as { error: string }).error
              : "Ошибка генерации";
          setError(errMsg);
          setStatus("error");
          return null;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError("Нет тела ответа");
          setStatus("error");
          return null;
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let accumulatedText = "";
        let finalDocument: GigDocument | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          const lines = accumulatedText.split("\n");
          accumulatedText = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.document) {
                const merged: GigDocument = {
                  ...(finalDocument ?? {}),
                  ...parsed.document,
                };
                setDocument((prev) => ({ ...prev, ...parsed.document }));
                finalDocument = merged;
                onDocumentUpdate?.(merged);
              }

              if (parsed.quickReplies?.length) {
                setQuickReplies(parsed.quickReplies);
              }

              if (parsed.done) {
                finalDocument =
                  finalDocument ?? parsed.document ?? currentDocument ?? {};
                if (parsed.document) {
                  finalDocument = { ...finalDocument, ...parsed.document };
                }
                if (parsed.error) {
                  setError(parsed.error);
                }
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }

        setStatus("idle");
        return finalDocument ?? { ...(currentDocument ?? document) };
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return null;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Не удалось сгенерировать задание",
        );
        setStatus("error");
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [workspaceId, document, apiEndpoint, timeout, onDocumentUpdate],
  );

  return {
    document,
    quickReplies,
    status,
    error,
    sendMessage,
  };
}
