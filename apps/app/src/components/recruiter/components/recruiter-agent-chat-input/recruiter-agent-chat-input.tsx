"use client";

import { Button } from "@qbs-autonaim/ui/button";
import cn from "@qbs-autonaim/ui/cn";
import { ArrowUp, Square } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RecruiterAgentStatus } from "~/hooks/use-recruiter-agent";

interface RecruiterAgentChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onStop: () => void;
  status: RecruiterAgentStatus;
  placeholder?: string;
  className?: string;
}

export function RecruiterAgentChatInput({
  onSendMessage,
  onStop,
  status,
  placeholder = "Напишите сообщение…",
  className,
}: RecruiterAgentChatInputProps) {
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
        handleSubmit().catch((error) => {
          console.error("Failed to send message:", error);
        });
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
            handleSubmit().catch((error) => {
              console.error("Failed to send message:", error);
            });
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
            rows={2}
            className={cn(
              "min-h-14 max-h-50 w-full grow resize-none",
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

