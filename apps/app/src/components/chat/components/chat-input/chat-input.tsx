"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  onSend?: (message: string) => Promise<void> | void;
  disabled: boolean;
  isProcessing?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onSend,
  disabled,
  isProcessing = false,
  placeholder = "Введите ваш ответ…",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    const handler = onSend ?? onSendMessage;
    if (handler) {
      await handler(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? isProcessing
                  ? "Ожидайте ответа…"
                  : "Интервью завершено"
                : placeholder
            }
            disabled={disabled}
            rows={1}
            className="min-h-12 max-h-[200px] resize-none py-3 field-sizing-content"
            style={{ touchAction: "manipulation" }}
            aria-label="Введите ваше сообщение"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !message.trim()}
            className="h-12 w-12 shrink-0"
            aria-label="Отправить сообщение"
          >
            <SendHorizontal className="size-5" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Нажмите Enter для отправки, Shift+Enter для новой строки
        </p>
      </form>
    </div>
  );
}
