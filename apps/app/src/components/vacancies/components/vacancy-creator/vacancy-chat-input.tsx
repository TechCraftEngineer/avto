"use client";

import { Button, Textarea } from "@qbs-autonaim/ui";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef } from "react";

interface VacancyChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function VacancyChatInput({
  onSendMessage,
  disabled = false,
}: VacancyChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автофокус на desktop при загрузке
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleSend = () => {
    const message = textareaRef.current?.value.trim();
    if (!message) return;

    onSendMessage(message);

    // Очищаем и возвращаем фокус
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          placeholder="Опишите требования к вакансии…"
          disabled={disabled}
          className="min-h-[80px] resize-none pr-12 text-base"
          style={{
            fontSize: "16px",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
          autoComplete="off"
          spellCheck
          name="vacancy-message"
          aria-label="Сообщение для ассистента"
        />
        <Button
          onClick={handleSend}
          disabled={disabled}
          size="icon"
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full"
          style={{ touchAction: "manipulation" }}
          aria-label={disabled ? "Отправка…" : "Отправить сообщение"}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        ⌘/Ctrl&nbsp;+&nbsp;Enter для отправки
      </p>
    </div>
  );
}
