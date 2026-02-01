"use client";

import { Button, Textarea } from "@qbs-autonaim/ui";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * ChatInput - Text input with auto-resize and keyboard shortcuts
 * Requirements: 8.7
 * Subtask 7.3: Textarea with auto-resize, Enter to send, Shift+Enter for newline
 */
export function ChatInput({
  onSend,
  disabled,
  placeholder = "Введите сообщение…",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height to scrollHeight (content height)
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage("");

    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends message, Shift+Enter adds newline (Requirement 8.7)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} aria-label="Форма отправки сообщения">
        <div className="relative flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Ожидайте ответа…" : placeholder}
            disabled={disabled}
            rows={1}
            className="min-h-[48px] max-h-[200px] resize-none pr-12 text-base"
            style={{
              fontSize: "16px", // Prevent zoom on iOS
              touchAction: "manipulation",
            }}
            aria-label="Введите ваше сообщение"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            size="icon"
            className="h-12 w-12 shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
            style={{ touchAction: "manipulation" }}
            aria-label={disabled ? "Отправка…" : "Отправить сообщение"}
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter для отправки, Shift&nbsp;+&nbsp;Enter для новой строки
        </p>
      </form>
    </div>
  );
}
