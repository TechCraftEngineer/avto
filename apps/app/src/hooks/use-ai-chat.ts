"use client";

import type { AIChatMessage, ChatStatus, TextPart } from "@qbs-autonaim/shared";
import { useCallback, useRef, useState } from "react";

interface UseAIChatOptions {
  /** API endpoint для отправки сообщений */
  apiEndpoint: string;
  /** Начальные сообщения */
  initialMessages?: AIChatMessage[];
  /** ID чата/разговора */
  chatId?: string;
  /** Callback при получении нового сообщения */
  onMessage?: (message: AIChatMessage) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
  /** Callback при завершении */
  onFinish?: (messages: AIChatMessage[]) => void;
}

interface UseAIChatReturn {
  messages: AIChatMessage[];
  status: ChatStatus;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  setMessages: React.Dispatch<React.SetStateAction<AIChatMessage[]>>;
  clearMessages: () => void;
  regenerate: () => Promise<void>;
}

/**
 * Хук для работы с AI чатом со streaming
 * Адаптирован из ai-chatbot useChat
 */
export function useAIChat({
  apiEndpoint,
  initialMessages = [],
  chatId,
  onMessage,
  onError,
  onFinish,
}: UseAIChatOptions): UseAIChatReturn {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const messagesRef = useRef<AIChatMessage[]>(messages);
  messagesRef.current = messages;

  const generateId = useCallback(
    () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      lastUserMessageRef.current = content;
      setError(null);
      setStatus("submitted");

      // Создаём сообщение пользователя
      const userMessage: AIChatMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: content }],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Создаём placeholder для ответа ассистента
      const assistantMessageId = generateId();
      const assistantMessage: AIChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Создаём AbortController для возможности отмены
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            chatId,
            messages: messagesRef.current.map((m) => ({
              role: m.role,
              content: m.parts
                .filter((p): p is TextPart => p.type === "text")
                .map((p) => p.text)
                .join("\n"),
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Обновляем сообщение ассистента
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    parts: [{ type: "text", text: accumulatedText }],
                  }
                : msg,
            ),
          );
        }

        // Финальное обновление
        const finalMessage: AIChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: [{ type: "text", text: accumulatedText }],
          createdAt: new Date(),
        };

        let updatedMessages: AIChatMessage[] = [];
        setMessages((prev) => {
          updatedMessages = prev.map((msg) =>
            msg.id === assistantMessageId ? finalMessage : msg,
          );
          return updatedMessages;
        });
        onFinish?.(updatedMessages);

        onMessage?.(finalMessage);
        setStatus("idle");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Запрос был отменён пользователем
          setStatus("idle");
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        onError?.(error);

        // Удаляем пустое сообщение ассистента при ошибке
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [apiEndpoint, chatId, generateId, onMessage, onError, onFinish],
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("idle");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  const regenerate = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // Удаляем последнее сообщение ассистента и предшествующее сообщение пользователя за один проход
    setMessages((prev) => {
      let lastAssistantIndex = -1;
      let lastUserIndex = -1;

      // Находим последнее сообщение ассистента
      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg && msg.role === "assistant") {
          lastAssistantIndex = i;
          break;
        }
      }

      // Находим последнее сообщение пользователя
      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg && msg.role === "user") {
          lastUserIndex = i;
          break;
        }
      }

      // Если ничего не найдено, возвращаем исходный массив
      if (lastAssistantIndex === -1 && lastUserIndex === -1) return prev;

      // Удаляем оба сообщения, обрезая до меньшего индекса
      const cutIndex = Math.min(
        lastAssistantIndex === -1
          ? Number.POSITIVE_INFINITY
          : lastAssistantIndex,
        lastUserIndex === -1 ? Number.POSITIVE_INFINITY : lastUserIndex,
      );

      return cutIndex === Number.POSITIVE_INFINITY
        ? prev
        : prev.slice(0, cutIndex);
    });

    // Повторно отправляем
    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  return {
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    clearMessages,
    regenerate,
  };
}
