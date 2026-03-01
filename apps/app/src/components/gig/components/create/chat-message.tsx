"use client";

import { cn } from "@qbs-autonaim/ui/utils";
import { Bot, User } from "lucide-react";
import { memo } from "react";
import { QuickReplies } from "./quick-replies";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickReply?: (reply: string) => void;
  isDisabled?: boolean;
}

export function ChatMessage({
  message,
  onQuickReply,
  isDisabled,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className="space-y-2">
      <div
        className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          {message.content}
        </div>
      </div>
      {!isUser &&
        message.quickReplies &&
        message.quickReplies.length > 0 &&
        onQuickReply && (
          <div className="ml-11">
            <QuickReplies
              replies={message.quickReplies}
              onSelect={onQuickReply}
              disabled={isDisabled}
            />
          </div>
        )}
    </div>
  );
}

interface StreamingMessageProps {
  content: string;
  quickReplies?: string[];
  onSelectOption: (value: string) => void;
}

const StreamingMessageComponent = ({
  content,
  quickReplies = [],
  onSelectOption,
}: StreamingMessageProps) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap max-w-[85%]">
          {content}
          <span
            className="inline-block h-4 w-px mx-0.5 bg-foreground/60 motion-safe:animate-pulse motion-reduce:animate-none align-middle"
            aria-hidden
          />
        </div>
      </div>
      {quickReplies.length > 0 && (
        <div className="ml-11">
          <QuickReplies
            replies={quickReplies}
            onSelect={onSelectOption}
            disabled
          />
        </div>
      )}
    </div>
  );
};

export const StreamingMessage = memo(StreamingMessageComponent);

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-foreground/40 motion-safe:animate-bounce motion-reduce:animate-none [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-foreground/40 motion-safe:animate-bounce motion-reduce:animate-none [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-foreground/40 motion-safe:animate-bounce motion-reduce:animate-none" />
      </div>
    </div>
  );
}
