"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import { Bot, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { MultiSelectReplies } from "./multi-select-replies";
import type { ConversationMessage, QuickReply } from "./types";
import { TypingIndicator } from "./typing-indicator";

interface ChatMessageProps {
  message: ConversationMessage;
  onQuickReplySelect: (value: string) => void;
  onMultiSelectSubmit: (values: string[]) => Promise<void>;
  isLatest: boolean;
  disabled: boolean;
}

export function ChatMessage({
  message,
  onQuickReplySelect,
  onMultiSelectSubmit,
  isLatest,
  disabled,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const showQuickReplies =
    isLatest && !isUser && message.quickReplies && !disabled;
  const isMultiSelect = message.isMultiSelect && showQuickReplies;

  // Состояние для freeform полей
  const [freeformInputs, setFreeformInputs] = useState<Record<string, string>>(
    {},
  );
  const [activeFreeform, setActiveFreeform] = useState<string | null>(null);

  const handleFreeformToggle = (replyId: string) => {
    setActiveFreeform(activeFreeform === replyId ? null : replyId);
  };

  const handleFreeformSubmit = (replyId: string, reply: QuickReply) => {
    const customValue = freeformInputs[replyId]?.trim();
    if (customValue) {
      onQuickReplySelect(`${reply.value}: ${customValue}`);
      setActiveFreeform(null);
      setFreeformInputs((prev) => ({ ...prev, [replyId]: "" }));
    }
  };

  const handleFreeformInputChange = (replyId: string, value: string) => {
    setFreeformInputs((prev) => ({ ...prev, [replyId]: value }));
  };

  return (
    <article
      className={cn(
        "flex gap-2 rounded-lg p-3 transition-all duration-200 md:gap-3 md:p-4",
        "animate-in fade-in slide-in-from-bottom-2",
        isUser ? "bg-primary/5" : "bg-muted/50",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
        ) : (
          <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <span className="text-xs font-medium md:text-sm">
            {isUser ? "Вы" : "Ассистент"}
          </span>
          {message.isStreaming ? (
            <TypingIndicator />
          ) : (
            <div className="prose prose-xs max-w-none text-xs leading-relaxed md:text-sm md:prose-sm">
              {isUser ? (
                <p className="whitespace-pre-wrap text-xs leading-relaxed md:text-sm">
                  {message.content}
                </p>
              ) : (
                <ReactMarkdown
                  components={{
                    // Customize markdown rendering
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-2 ml-4 list-disc space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-2 ml-4 list-decimal space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mb-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {showQuickReplies &&
          message.quickReplies &&
          (isMultiSelect ? (
            <MultiSelectReplies
              replies={message.quickReplies}
              onSubmit={onMultiSelectSubmit}
              disabled={disabled}
            />
          ) : (
            <div className="space-y-3 pt-2">
              {message.quickReplies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      reply.freeform
                        ? handleFreeformToggle(reply.id)
                        : onQuickReplySelect(reply.value)
                    }
                    disabled={disabled}
                    className="h-auto px-3 py-1.5 text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ touchAction: "manipulation" }}
                  >
                    {reply.freeform ? (
                      <>
                        {reply.label}
                        <span className="ml-1 text-muted-foreground">
                          {activeFreeform === reply.id ? "✏️" : "💬"}
                        </span>
                      </>
                    ) : (
                      reply.label
                    )}
                  </Button>

                  {/* Freeform input field */}
                  {reply.freeform && activeFreeform === reply.id && (
                    <div className="flex gap-2 ml-4">
                      <textarea
                        value={freeformInputs[reply.id] || ""}
                        onChange={(e) =>
                          handleFreeformInputChange(reply.id, e.target.value)
                        }
                        placeholder={
                          reply.placeholder || "Опишите своими словами..."
                        }
                        maxLength={reply.maxLength || 1000}
                        className="min-h-[60px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleFreeformSubmit(reply.id, reply);
                          }
                          if (e.key === "Escape") {
                            setActiveFreeform(null);
                          }
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleFreeformSubmit(reply.id, reply)}
                          disabled={
                            !freeformInputs[reply.id]?.trim() || disabled
                          }
                          className="px-2 py-1 h-6 text-xs"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveFreeform(null)}
                          className="px-2 py-1 h-6 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </article>
  );
}
