import { cn } from "@qbs-autonaim/ui";
import { ArrowDown } from "lucide-react";
import { useScrollToBottom } from "~/hooks/use-scroll-to-bottom";
import type { ChatMessage, ChatStatus } from "~/types/chat";
import { Message } from "./chat-message";
import { ThinkingIndicator } from "./thinking-indicator";

interface MessagesListProps {
  messages: ChatMessage[];
  status: ChatStatus;
  emptyStateComponent?: React.ReactNode;
}

export function MessagesList({
  messages,
  status,
  emptyStateComponent,
}: MessagesListProps) {
  const { containerRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom();

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="История чата"
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {messages.length === 0 && emptyStateComponent}

          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={isStreaming && index === messages.length - 1}
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
