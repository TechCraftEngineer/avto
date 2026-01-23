"use client";

import { Button, cn, ScrollArea } from "@qbs-autonaim/ui";
import {
  AlertCircle,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Square,
  User,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type ConversationMessage,
  type RecruiterAgentDocument,
  type RecruiterAgentStatus,
  useRecruiterAgent,
} from "~/hooks/use-recruiter-agent";

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
export function RecruiterAgentChat({
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
        isExpanded ? "h-150" : "h-auto min-h-15",
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
          <RecruiterMessages
            history={history}
            status={status}
            currentAction={currentAction}
            sendMessage={sendMessage}
          />

          {/* Ввод */}
          <RecruiterChatInput
            onSendMessage={sendMessage}
            onStop={stop}
            status={status}
            placeholder={placeholder}
          />
        </>
      )}
    </div>
  );
}

interface RecruiterMessagesProps {
  history: ConversationMessage[];
  status: RecruiterAgentStatus;
  currentAction: { id: string; type: string; progress: number } | null;
  sendMessage?: (message: string) => Promise<void>;
}

function RecruiterMessages({
  history,
  status,
  currentAction,
  sendMessage,
}: RecruiterMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Автоскролл при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      } else {
        // Fallback для случаев когда ScrollArea не инициализирована
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  });

  if (history.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 font-semibold text-lg">
          Привет! Я ваш AI-ассистент
        </h2>
        <p className="max-w-md text-muted-foreground text-sm">
          Я могу помочь найти кандидатов, проанализировать вакансию, создать
          описание или написать сообщение кандидату. Просто спросите!
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <SuggestionChip
            text="Найди 5 кандидатов, готовых выйти за 2 недели"
            onClick={
              sendMessage
                ? () =>
                    sendMessage("Найди 5 кандидатов, готовых выйти за 2 недели")
                : undefined
            }
          />
          <SuggestionChip
            text="Почему у вакансии мало откликов?"
            onClick={
              sendMessage
                ? () => sendMessage("Почему у вакансии мало откликов?")
                : undefined
            }
          />
          <SuggestionChip
            text="Напиши приглашение на интервью"
            onClick={
              sendMessage
                ? () => sendMessage("Напиши приглашение на интервью")
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {history.map((message, index) => (
          <RecruiterMessage
            key={`${message.role}-${index}-${message.timestamp.getTime()}`}
            message={message}
          />
        ))}

        {/* Индикатор текущего действия */}
        {currentAction && (
          <ActionProgressIndicator
            actionType={currentAction.type}
            progress={currentAction.progress}
          />
        )}

        {/* Индикатор загрузки */}
        {isStreaming && !currentAction && (
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="size-4 animate-pulse text-primary" />
            </div>
            <div className="flex items-center gap-2 py-2">
              <span className="text-foreground text-sm font-medium">Думаю</span>
              <div className="flex gap-1">
                <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"></span>
                <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"></span>
                <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

interface RecruiterMessageProps {
  message: ConversationMessage;
}

const RecruiterMessage = memo(function RecruiterMessage({
  message,
}: RecruiterMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className="group/message w-full animate-in fade-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn("flex w-full items-start gap-3", {
          "flex-row-reverse": isUser,
        })}
      >
        {/* Аватар ассистента */}
        {!isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <Sparkles className="size-4" />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "items-start": !isUser,
            "items-end": isUser,
          })}
        >
          <div
            className={cn(
              "max-w-[85%] sm:max-w-[70%] wrap-break-word rounded-2xl px-4 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Метаданные для ассистента */}
          {!isUser && message.metadata?.intent && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
              <span className="rounded bg-background px-2 py-1 border">
                {formatIntent(message.metadata.intent)}
              </span>
              {message.metadata.actions &&
                message.metadata.actions.length > 0 && (
                  <span className="text-muted-foreground">
                    {message.metadata.actions.length} действий выполнено
                  </span>
                )}
            </div>
          )}
        </div>

        {/* Аватар пользователя */}
        {isUser && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <User className="size-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </article>
  );
});

interface ActionProgressIndicatorProps {
  actionType: string;
  progress: number;
}

function ActionProgressIndicator({
  actionType,
  progress,
}: ActionProgressIndicatorProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Loader2 className="size-4 animate-spin text-primary" />
      </div>
      <div className="flex-1 py-2">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">
            {formatActionType(actionType)}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({
  text,
  onClick,
}: {
  text: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {text}
    </button>
  );
}

interface RecruiterChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onStop: () => void;
  status: RecruiterAgentStatus;
  placeholder?: string;
  className?: string;
}

function RecruiterChatInput({
  onSendMessage,
  onStop,
  status,
  placeholder = "Напишите сообщение…",
  className,
}: RecruiterChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const canSubmit = input.trim().length > 0 && !isLoading;

  // Автофокус на десктопе
  useEffect(() => {
    if (textareaRef.current && window.innerWidth > 768 && !isLoading) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setInput("");
    await onSendMessage(trimmedInput);

    if (window.innerWidth > 768) {
      textareaRef.current?.focus();
    }
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading) {
        onStop();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <form
        className={cn(
          "mx-auto max-w-3xl overflow-hidden rounded-xl border bg-background p-3 shadow-xs transition-all duration-200",
          "focus-within:border-ring hover:border-muted-foreground/50",
          className,
        )}
        onSubmit={(e) => {
          e.preventDefault();
          if (isLoading) {
            onStop();
          } else {
            handleSubmit();
          }
        }}
      >
        <div className="flex flex-row items-start gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              "min-h-11 max-h-50 w-full grow resize-none",
              "border-none bg-transparent p-2 text-base outline-none",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              fontSize: "16px",
            }}
            autoComplete="off"
            name="message"
            aria-label="Сообщение"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-muted-foreground text-xs">
            Enter — отправить, Shift+Enter — новая строка
          </p>

          {isLoading ? (
            <Button
              type="button"
              size="icon"
              className="size-8 rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
              onClick={onStop}
              aria-label="Остановить генерацию"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "size-8 rounded-full transition-colors",
                canSubmit
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground",
              )}
              disabled={!canSubmit}
              aria-label="Отправить сообщение"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function formatIntent(intent: string): string {
  const intentMap: Record<string, string> = {
    SEARCH_CANDIDATES: "Поиск кандидатов",
    ANALYZE_VACANCY: "Анализ вакансии",
    GENERATE_CONTENT: "Генерация контента",
    COMMUNICATE: "Коммуникация",
    CONFIGURE_RULES: "Настройка правил",
    GENERAL_QUESTION: "Общий вопрос",
  };
  return intentMap[intent] || intent;
}

function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    search_candidates: "Поиск кандидатов…",
    analyze_vacancy: "Анализ вакансии…",
    generate_content: "Генерация контента…",
    send_message: "Отправка сообщения…",
    apply_rule: "Применение правила…",
  };
  return actionMap[actionType] || `Выполняю: ${actionType}…`;
}
