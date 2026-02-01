"use client";

import { cn } from "@qbs-autonaim/ui";
import { ArrowDown } from "lucide-react";
import { memo } from "react";
import { useChatMessages } from "~/hooks/use-chat-messages";
import type { AIChatMessage, ChatStatus } from "~/types/ai-chat";
import { AIMessage } from "./ai-message";
import { ThinkingIndicator } from "./thinking-indicator";

interface AIMessagesProps {
  messages: AIChatMessage[];
  status: ChatStatus;
  isReadonly?: boolean;
  emptyStateComponent?: React.ReactNode;
}

function PureAIMessages({
  messages,
  status,
  isReadonly = false,
  emptyStateComponent,
}: AIMessagesProps) {
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useChatMessages({
    status,
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-pan-y overflow-y-auto"
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {messages.length === 0 && emptyStateComponent}

          {messages.map((message, index) => (
            <AIMessage
              key={message.id}
              message={message}
              isLoading={isStreaming && index === messages.length - 1}
              isReadonly={isReadonly}
            />
          ))}

          {isSubmitted && <ThinkingIndicator />}

          <div
            ref={endRef}
            className="min-h-[24px] min-w-[24px] shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Прокрутить вниз"
        className={cn(
          "-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted",
          isAtBottom
            ? "pointer-events-none scale-0 opacity-0"
            : "pointer-events-auto scale-100 opacity-100",
        )}
        onClick={() => scrollToBottom("smooth")}
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}

export const AIMessages = memo(PureAIMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.emptyStateComponent !== nextProps.emptyStateComponent)
    return false;
  return true;
});
