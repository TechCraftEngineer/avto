"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AIChatMessage,
  ChatStatus,
  MessagePart,
  TextPart,
} from "@qbs-autonaim/shared";

interface UseAIChatStreamOptions {
  apiEndpoint: string;
  initialMessages?: AIChatMessage[];
  chatId?: string;
  onMessage?: (message: AIChatMessage) => void;
  onError?: (error: Error) => void;
  onFinish?: (messages: AIChatMessage[]) => void;
}

type StreamPartType =
  | "0" // text-delta
  | "2" // data
  | "8" // message-start
  | "d" // finish-message
  | "e" // error
  | "f" // finish-step
  | "g" // reasoning
  | "a" // tool-call
  | "b"; // tool-result

interface StreamPart {
  type: StreamPartType;
  value: unknown;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseStreamLine(line: string): StreamPart | null {
  if (!line.startsWith("data: ")) return null;

  try {
    const jsonStr = line.slice(6);
    if (jsonStr === "[DONE]") return { type: "d", value: null };

    const parsed = JSON.parse(jsonStr);

    // Новый формат от Vercel AI SDK
    if (parsed.type === "text-delta") {
      return { type: "0", value: parsed.delta };
    }
    if (parsed.type === "text-end") {
      return { type: "d", value: null };
    }
    if (parsed.type === "finish-step") {
      return { type: "f", value: null };
    }
    if (parsed.type === "finish") {
      return { type: "d", value: null };
    }

    // Старый формат [type, value]
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return { type: parsed[0] as StreamPartType, value: parsed[1] };
    }

    return null;
  } catch {
    return null;
  }
}

export function useAIChatStream({
  apiEndpoint,
  initialMessages = [],
  chatId,
  onMessage,
  onError,
  onFinish,
}: UseAIChatStreamOptions) {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const messagesRef = useRef<AIChatMessage[]>(messages);

  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string, audioFile?: File) => {
      if (!content.trim() && !audioFile) return;

      console.log("[useAIChatStream] Sending message to:", apiEndpoint);
      console.log("[useAIChatStream] chatId:", chatId);

      lastUserMessageRef.current = content;
      setError(null);
      setStatus("submitted");

      const userMessageId = generateId();
      const userParts: MessagePart[] = [];

      // Добавляем аудио если есть
      if (audioFile) {
        const audioUrl = URL.createObjectURL(audioFile);
        userParts.push({
          type: "file",
          url: audioUrl,
          filename: audioFile.name,
          mediaType: audioFile.type || "audio/webm",
        });
        // Запланировать очистку URL после использования
        setTimeout(() => URL.revokeObjectURL(audioUrl), 60000);
      }

      // Добавляем текст если есть
      if (content.trim()) {
        userParts.push({ type: "text", text: content });
      }

      const userMessage: AIChatMessage = {
        id: userMessageId,
        role: "user",
        parts: userParts,
        createdAt: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        messagesRef.current = updated;
        return updated;
      });

      const assistantMessageId = generateId();
      const assistantMessage: AIChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        messagesRef.current = updated;
        return updated;
      });

      abortControllerRef.current = new AbortController();

      try {
        const currentMessages = messagesRef.current;

        // Формируем body - используем FormData если есть аудио
        let body: BodyInit;
        const headers: HeadersInit = {
          Accept: "text/event-stream",
        };

        if (audioFile) {
          const formData = new FormData();
          formData.append("audio", audioFile);
          formData.append(
            "data",
            JSON.stringify({
              id: chatId,
              message: {
                id: userMessageId,
                role: "user",
                parts: userParts.map((p) =>
                  p.type === "file"
                    ? {
                        type: "file",
                        mediaType: p.mediaType,
                        filename: p.filename,
                      }
                    : p,
                ),
              },
              messages: currentMessages
                .filter((m) => m.role !== "assistant" || m.parts.length > 0)
                .map((m) => ({
                  id: m.id,
                  role: m.role,
                  parts: m.parts
                    .filter((p): p is TextPart => p.type === "text")
                    .map((p) => ({ type: "text" as const, text: p.text })),
                })),
              conversationId: chatId,
            }),
          );
          body = formData;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify({
            id: chatId,
            message: {
              id: userMessageId,
              role: "user",
              parts: [{ type: "text", text: content }],
            },
            messages: currentMessages
              .filter((m) => m.role !== "assistant" || m.parts.length > 0)
              .map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts
                  .filter((p): p is TextPart => p.type === "text")
                  .map((p) => ({ type: "text" as const, text: p.text })),
              })),
            conversationId: chatId,
          });
        }

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers,
          body,
          signal: abortControllerRef.current.signal,
        });

        console.log("[useAIChatStream] Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[useAIChatStream] Error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let buffer = "";
        const currentParts: MessagePart[] = [];
        let currentTextPart: TextPart | null = null;
        let chunkCount = 0;

        console.log("[useAIChatStream] Starting to read stream");

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log(
              "[useAIChatStream] Stream done, total chunks:",
              chunkCount,
            );
            break;
          }

          chunkCount++;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            console.log(
              "[useAIChatStream] Received line:",
              trimmedLine.substring(0, 100),
            );

            const parsed = parseStreamLine(trimmedLine);
            if (!parsed) {
              console.warn(
                "[useAIChatStream] Failed to parse line:",
                trimmedLine,
              );
              continue;
            }

            const { type, value: data } = parsed;
            console.log("[useAIChatStream] Parsed type:", type);

            switch (type) {
              case "0": {
                // text-delta
                if (!currentTextPart) {
                  currentTextPart = { type: "text", text: "" };
                  currentParts.push(currentTextPart);
                }
                currentTextPart.text += data as string;
                break;
              }

              case "g": {
                // reasoning
                currentParts.push({
                  type: "reasoning",
                  text: data as string,
                });
                break;
              }

              case "a": {
                // tool-call
                const toolData = data as {
                  toolCallId: string;
                  toolName: string;
                  args: unknown;
                };
                currentParts.push({
                  type: "tool-call",
                  toolCallId: toolData.toolCallId,
                  toolName: toolData.toolName,
                  args: toolData.args,
                });
                break;
              }

              case "b": {
                // tool-result
                const resultData = data as {
                  toolCallId: string;
                  result: unknown;
                };
                currentParts.push({
                  type: "tool-result",
                  toolCallId: resultData.toolCallId,
                  result: resultData.result,
                });
                break;
              }

              case "e": {
                // error
                throw new Error(data as string);
              }

              case "d":
              case "f": {
                // finish
                break;
              }
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, parts: [...currentParts] }
                  : msg,
              ),
            );
          }
        }

        const finalMessage: AIChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: currentParts,
          createdAt: new Date(),
        };

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? finalMessage : msg,
          ),
        );

        onMessage?.(finalMessage);
        setMessages((prev) => {
          onFinish?.(prev);
          return prev;
        });
        setStatus("idle");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        onError?.(error);

        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [apiEndpoint, chatId, onMessage, onError, onFinish],
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

    setMessages((prev) => {
      let lastAssistantIndex = -1;
      let lastUserIndex = -1;

      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg) {
          if (lastAssistantIndex === -1 && msg.role === "assistant") {
            lastAssistantIndex = i;
          }
          if (lastUserIndex === -1 && msg.role === "user") {
            lastUserIndex = i;
          }
        }
        if (lastAssistantIndex !== -1 && lastUserIndex !== -1) break;
      }

      if (lastAssistantIndex === -1 || lastUserIndex === -1) return prev;

      const cutIndex = Math.min(lastAssistantIndex, lastUserIndex);
      return prev.slice(0, cutIndex);
    });

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
