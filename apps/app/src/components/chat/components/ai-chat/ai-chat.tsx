"use client";

import { cn } from "@qbs-autonaim/ui";
import { AlertCircle } from "lucide-react";
import { useAIChat } from "~/hooks/use-ai-chat";
import type { AIChatMessage } from "~/types/ai-chat";
import { AIChatInput } from "./ai-chat-input";
import { AIMessages } from "./ai-messages";

interface AIChatProps {
  /** API endpoint для отправки сообщений */
  apiEndpoint: string;
  /** ID чата/разговора */
  chatId?: string;
  /** Начальные сообщения */
  initialMessages?: AIChatMessage[];
  /** Заголовок чата */
  title?: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Только чтение */
  isReadonly?: boolean;
  /** Показывать кнопку прикрепления файлов */
  showAttachments?: boolean;
  /** Placeholder для ввода */
  placeholder?: string;
  /** Компонент пустого состояния */
  emptyStateComponent?: React.ReactNode;
  /** Компонент заголовка */
  headerComponent?: React.ReactNode;
  /** Callback при отправке сообщения */
  onSendMessage?: (message: string) => void;
  /** Callback при получении ответа */
  onResponse?: (message: AIChatMessage) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
  /** CSS класс */
  className?: string;
}

/**
 * Главный компонент AI чата
 * Адаптирован из ai-chatbot Chat.tsx
 */
export function AIChat({
  apiEndpoint,
  chatId,
  initialMessages = [],
  title,
  subtitle,
  isReadonly = false,
  showAttachments = false,
  placeholder,
  emptyStateComponent,
  headerComponent,
  onSendMessage,
  onResponse,
  onError,
  className,
}: AIChatProps) {
  const { messages, status, error, sendMessage, stop } = useAIChat({
    apiEndpoint,
    initialMessages,
    chatId,
    onMessage: onResponse,
    onError,
  });

  const handleSendMessage = async (content: string) => {
    onSendMessage?.(content);
    await sendMessage(content);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Заголовок */}
      {headerComponent ||
        (title && (
          <header className="shrink-0 border-b bg-background px-4 py-3">
            <h1 className="font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </header>
        ))}

      {/* Ошибка */}
      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      {/* Сообщения */}
      <AIMessages
        messages={messages}
        status={status}
        isReadonly={isReadonly}
        emptyStateComponent={emptyStateComponent}
      />

      {/* Ввод */}
      {!isReadonly && (
        <AIChatInput
          onSendMessage={handleSendMessage}
          onStop={stop}
          status={status}
          placeholder={placeholder}
          showAttachments={showAttachments}
        />
      )}
    </div>
  );
}
