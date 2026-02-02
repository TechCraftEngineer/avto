"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import { AlertCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { memo, useState } from "react";
import {
  type RecruiterAgentDocument,
  useRecruiterAgent,
} from "~/hooks/use-recruiter-agent";
import { RecruiterAgentChatInput } from "../recruiter-agent-chat-input";
import { RecruiterAgentMessages } from "../recruiter-agent-messages";

interface RecruiterAgentChatProps {
  vacancyId?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
  onMessage?: (document: RecruiterAgentDocument) => void;
  onError?: (error: Error) => void;
}

/**
 * Компонент чата с AI-ассистентом рекрутера
 *
 * Реализует:
 * - Chat UI с messages container
 * - Input field и send button
 * - Loading indicator
 *
 * Requirements: 1.1, 1.3
 */
const RecruiterAgentChat = memo(function RecruiterAgentChat({
  vacancyId,
  title = "AI-ассистент рекрутера",
  subtitle,
  placeholder = "Спросите что-нибудь…",
  className,
  onMessage,
  onError,
}: RecruiterAgentChatProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    history,
    status,
    error,
    currentAction,
    sendMessage,
    stop,
    clearHistory,
  } = useRecruiterAgent({
    vacancyId,
    onMessage,
    onError,
  });

  return (
    <div
      className={cn(
        "flex flex-col border rounded-lg bg-background shadow-sm",
        isExpanded ? "flex-1 min-h-0" : "h-auto min-h-15",
        className,
      )}
    >
      {/* Заголовок */}
      {title && (
        <header className="shrink-0 border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-muted-foreground"
                >
                  Очистить
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground"
                aria-label={isExpanded ? "Свернуть чат" : "Развернуть чат"}
              >
                {isExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Превью последнего сообщения когда чат свернут */}
      {!isExpanded && history.length > 0 && (
        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4" />
            <span className="truncate">
              {history[history.length - 1]?.content || ""}
            </span>
          </div>
        </div>
      )}

      {/* Содержимое чата */}
      {isExpanded && (
        <>
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
          <RecruiterAgentMessages
            history={history}
            status={status}
            currentAction={currentAction}
            sendMessage={sendMessage}
          />

          {/* Ввод */}
          <RecruiterAgentChatInput
            onSendMessage={sendMessage}
            onStop={stop}
            status={status}
            placeholder={placeholder}
          />
        </>
      )}
    </div>
  );
});

RecruiterAgentChat.displayName = "RecruiterAgentChat";

export { RecruiterAgentChat };
