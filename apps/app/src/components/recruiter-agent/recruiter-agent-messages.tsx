"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { Sparkles } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type {
  ConversationMessage,
  RecruiterAgentStatus,
} from "~/hooks/use-recruiter-agent";
import { ActionProgressIndicator } from "./action-progress-indicator";
import { RecruiterAgentMessage } from "./recruiter-agent-message";
import { SuggestionChip } from "./suggestion-chip";

interface RecruiterAgentMessagesProps {
  history: ConversationMessage[];
  status: RecruiterAgentStatus;
  currentAction: { id: string; type: string; progress: number } | null;
  sendMessage?: (message: string) => Promise<void>;
}

const RecruiterAgentMessages = memo(function RecruiterAgentMessages({
  history,
  status,
  currentAction,
  sendMessage,
}: RecruiterAgentMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Автоскролл при новых сообщениях
  useEffect(() => {
    if (history.length === 0 || !scrollRef.current) return;

    const scrollElement = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    } else {
      // Fallback для случаев когда ScrollArea не инициализирована
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
      {history.length === 0 ? (
        <div className="flex min-h-full flex-col items-center justify-start p-6 text-center sm:justify-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">
            Привет! Я ваш AI-ассистент
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
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
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {history.map((message, index) => (
            <RecruiterAgentMessage
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
                <span className="text-sm font-medium text-foreground">Думаю</span>
                <div className="flex gap-1">
                  <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"></span>
                  <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"></span>
                  <span className="inline-block size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  );
});

RecruiterAgentMessages.displayName = "RecruiterAgentMessages";

export { RecruiterAgentMessages };
