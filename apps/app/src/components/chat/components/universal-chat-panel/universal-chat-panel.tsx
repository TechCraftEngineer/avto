"use client";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { QuickReplies } from "./quick-replies";
import { TypingIndicator } from "./typing-indicator";

interface UniversalChatPanelProps {
  entityType: "gig" | "vacancy" | "project" | "team";
  entityId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  welcomeMessage?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  createdAt: Date;
}

export function UniversalChatPanel({
  entityType,
  entityId,
  isOpen,
  onClose,
  title = "AI Помощник",
  description = "Задавайте вопросы и получайте аналитику",
  welcomeMessage,
}: UniversalChatPanelProps) {
  const trpc = useTRPC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );

  const historyQuery = useQuery(
    trpc.chat.getHistory.queryOptions({
      entityType,
      entityId,
      limit: 50,
    }),
  );

  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages as ChatMessage[]);
    }
  }, [historyQuery.data]);

  const sendMessageMutation = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onMutate: async (variables) => {
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          role: "user",
          content: variables.message,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        setLastFailedMessage(null);
      },
      onSuccess: (data) => {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          quickReplies: data.quickReplies,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        setLastFailedMessage(null);
      },
      onError: (err) => {
        const errorCode = err.data?.code;
        let errorMessage = err.message;

        if (errorCode === "TOO_MANY_REQUESTS") {
          const retryMatch = err.message.match(/(\d+)\s+секунд/);
          const retrySeconds = retryMatch ? retryMatch[1] : "60";
          errorMessage = `Слишком много запросов. Подождите ${retrySeconds} секунд`;
          toast.error("Превышен лимит запросов", {
            description: errorMessage,
          });
        } else if (errorCode === "FORBIDDEN") {
          errorMessage = "Нет доступа";
          toast.error("Ошибка доступа", {
            description: errorMessage,
          });
        } else if (errorCode === "NOT_FOUND") {
          errorMessage = "Сущность не найдена";
          toast.error("Ошибка", {
            description: errorMessage,
          });
        } else {
          toast.error("Не удалось получить ответ", {
            description: "Попробуйте ещё раз или обновите страницу",
          });
        }

        setError(errorMessage);
        setIsLoading(false);

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "user") {
            setLastFailedMessage(lastMessage.content);
            return prev.slice(0, -1);
          }
          return prev;
        });
      },
    }),
  );

  const clearHistoryMutation = useMutation(
    trpc.chat.clearHistory.mutationOptions({
      onSuccess: () => {
        setMessages([]);
        setError(null);
      },
    }),
  );

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate({ entityType, entityId, message });
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите очистить историю чата? Это действие нельзя отменить.",
      )
    ) {
      clearHistoryMutation.mutate({ entityType, entityId });
    }
  };

  const lastMessage = messages[messages.length - 1];
  const showQuickReplies =
    lastMessage?.role === "assistant" &&
    lastMessage.quickReplies &&
    lastMessage.quickReplies.length > 0 &&
    !isLoading;

  const isEmptyHistory =
    messages.length === 0 && !historyQuery.isLoading && !isLoading;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        aria-label={title}
      >
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearHistoryMutation.isPending}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
                aria-label="Очистить историю чата"
              >
                Очистить
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {isEmptyHistory ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="bg-muted/50 mb-4 rounded-full p-4">
                <svg
                  className="text-muted-foreground h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Иконка чата</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {welcomeMessage || "Добро пожаловать в AI помощник"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md text-sm">
                Задавайте вопросы и получайте аналитику на основе данных.
              </p>
            </div>
          ) : (
            <ChatMessageList
              messages={messages}
              isLoading={historyQuery.isLoading}
            />
          )}

          {isLoading && <TypingIndicator />}

          {showQuickReplies && lastMessage.quickReplies && (
            <QuickReplies
              replies={lastMessage.quickReplies}
              onSelect={handleQuickReply}
              disabled={isLoading}
            />
          )}

          {error && (
            <div
              className="border-t bg-destructive/10 p-3"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="text-destructive text-sm font-medium">Ошибка</p>
                  <p className="text-destructive/80 text-xs">{error}</p>
                </div>
                {lastFailedMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Повторить
                  </Button>
                )}
              </div>
            </div>
          )}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Спросите что-нибудь…"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
