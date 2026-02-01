"use client";

import { cn } from "@qbs-autonaim/ui";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAIChatStream } from "~/hooks/use-ai-chat-stream";
import type { AIChatMessage } from "~/types/ai-chat";
import { convertLegacyMessage } from "~/types/ai-chat";
import { AIChatInput } from "./ai-chat-input";
import { AIMessages } from "./ai-messages";

interface LegacyMessage {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
  voiceTranscription?: string | null;
  fileUrl?: string | null;
}

interface StreamingChatProps {
  /** API endpoint для streaming */
  apiEndpoint?: string;
  /** ID разговора */
  conversationId?: string;
  /** Начальные сообщения (legacy формат) */
  initialMessages?: LegacyMessage[];
  /** Статус разговора */
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  /** Имя кандидата */
  candidateName?: string;
  /** Показывать статус подключения */
  showConnectionStatus?: boolean;
  /** Callback при отправке сообщения */
  onSendMessage?: (message: string) => void;
  /** Callback при получении ответа */
  onResponse?: (message: AIChatMessage) => void;
  /** CSS класс */
  className?: string;
}

/**
 * Компонент чата со streaming поддержкой
 * Совместим с legacy форматом сообщений
 */
export function StreamingChat({
  apiEndpoint = "/api/chat/stream",
  conversationId,
  initialMessages = [],
  status = "ACTIVE",
  candidateName,
  showConnectionStatus = true,
  onSendMessage,
  onResponse,
  className,
}: StreamingChatProps) {
  const [isOnline, setIsOnline] = useState(true);

  // Конвертируем legacy сообщения в новый формат
  const convertedInitialMessages = initialMessages.map(convertLegacyMessage);

  const {
    messages,
    status: chatStatus,
    error,
    sendMessage,
    stop,
  } = useAIChatStream({
    apiEndpoint,
    initialMessages: convertedInitialMessages,
    chatId: conversationId,
    onMessage: onResponse,
    onError: (err) => {
      console.error("Chat error:", err);
      setIsOnline(false);
      setTimeout(() => setIsOnline(true), 5000);
    },
  });

  // Отслеживаем онлайн статус
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    onSendMessage?.(content);
    await sendMessage(content);
  };

  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const isDisabled = isCompleted || isCancelled || !isOnline;

  // Мемоизируем emptyState для стабильной ссылки
  const emptyStateComponent = useMemo(
    () => (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            {candidateName
              ? `Начните диалог с ${candidateName}`
              : "Начните диалог"}
          </p>
          <p className="mt-1 text-xs">Напишите сообщение, чтобы начать</p>
        </div>
      </div>
    ),
    [candidateName],
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Заголовок */}
      <header className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">
              {candidateName || "Чат"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCompleted && "Интервью завершено"}
              {isCancelled && "Интервью отменено"}
              {!isCompleted && !isCancelled && "Активный диалог"}
            </p>
          </div>

          {/* Статус подключения */}
          {showConnectionStatus && (
            <output
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                isOnline
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
              )}
              aria-live="polite"
            >
              {isOnline ? (
                <>
                  <Wifi className="size-3" aria-hidden="true" />
                  <span>Онлайн</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-3" aria-hidden="true" />
                  <span>Переподключение…</span>
                </>
              )}
            </output>
          )}
        </div>
      </header>

      {/* Ошибка */}
      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <p>{error.message}</p>
        </div>
      )}

      {/* Сообщения */}
      <AIMessages
        messages={messages}
        status={chatStatus}
        isReadonly={isDisabled}
        emptyStateComponent={emptyStateComponent}
      />

      {/* Ввод */}
      {!isCompleted && !isCancelled && (
        <AIChatInput
          onSendMessage={handleSendMessage}
          onStop={stop}
          status={chatStatus}
          disabled={!isOnline}
          placeholder={
            !isOnline
              ? "Переподключение…"
              : chatStatus === "streaming"
                ? "Ожидайте ответа…"
                : "Напишите сообщение…"
          }
        />
      )}

      {/* Сообщение о завершении */}
      {(isCompleted || isCancelled) && (
        <div className="border-t bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          {isCompleted && "Интервью завершено. Спасибо за участие!"}
          {isCancelled && "Интервью было отменено."}
        </div>
      )}
    </div>
  );
}
