"use client";

import { useCallback, useRef, useState } from "react";
import { z } from "zod";

const payloadSchema = z.object({
  workspaceId: z.string().min(1),
  message: z.string().min(1).max(2000),
  context: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      deliverables: z.string().optional(),
      requiredSkills: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .max(20),
});

const streamChunkSchema = z.object({
  document: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      deliverables: z.string().optional(),
      requiredSkills: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
    })
    .optional(),
  quickReplies: z.array(z.string()).optional(),
  done: z.boolean().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  partial: z.boolean().optional(),
});

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
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      abortControllerRef.current?.abort();
      if (timeoutIdRef.current != null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      abortControllerRef.current = new AbortController();
      timeoutIdRef.current = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);

      const history = (conversationHistory ?? []).slice(0, 20);
      const payload = {
        workspaceId,
        message: content,
        context: currentDocument ?? document,
        conversationHistory: history,
      };
      const validation = payloadSchema.safeParse(payload);
      if (!validation.success) {
        const msg = validation.error.issues
          .map((issue: { message: string }) => issue.message)
          .join("; ");
        setError(msg);
        setStatus("idle");
        return null;
      }

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: validation.data.workspaceId,
            message: validation.data.message,
            currentDocument: validation.data.context,
            conversationHistory: validation.data.conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (timeoutIdRef.current != null) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

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
            let parsed: unknown;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }
            const chunk = streamChunkSchema.safeParse(parsed);
            if (!chunk.success) continue;

            const doc = chunk.data.document;
            if (doc) {
              const sanitizedDoc: GigDocument = {
                title: typeof doc.title === "string" ? doc.title : undefined,
                description:
                  typeof doc.description === "string"
                    ? doc.description
                    : undefined,
                deliverables:
                  typeof doc.deliverables === "string"
                    ? doc.deliverables
                    : undefined,
                requiredSkills:
                  typeof doc.requiredSkills === "string"
                    ? doc.requiredSkills
                    : undefined,
                budgetRange:
                  typeof doc.budgetRange === "string"
                    ? doc.budgetRange
                    : undefined,
                timeline:
                  typeof doc.timeline === "string" ? doc.timeline : undefined,
              };
              const merged: GigDocument = {
                ...(finalDocument ?? {}),
                ...sanitizedDoc,
              };
              setDocument((prev) => ({ ...prev, ...sanitizedDoc }));
              finalDocument = merged;
              onDocumentUpdate?.(merged);
            }

            const replies = chunk.data.quickReplies;
            if (Array.isArray(replies) && replies.length > 0) {
              const sanitized = replies.filter(
                (r): r is string => typeof r === "string",
              );
              setQuickReplies(sanitized);
            }

            if (chunk.data.done) {
              const finalDoc = chunk.data.document;
              finalDocument =
                finalDocument ??
                (finalDoc as GigDocument | undefined) ??
                currentDocument ??
                {};
              if (finalDoc) {
                finalDocument = {
                  ...finalDocument,
                  ...(finalDoc as GigDocument),
                };
              }
              if (typeof chunk.data.error === "string") {
                setError(chunk.data.error);
              }
            }
          }
        }

        setStatus("idle");
        return finalDocument ?? { ...(currentDocument ?? document) };
      } catch (err) {
        if (timeoutIdRef.current != null) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

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
