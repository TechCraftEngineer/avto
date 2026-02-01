"use client";

import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  isProcessing: boolean;
}

export function ChatInput({
  onSendMessage,
  disabled,
  isProcessing,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter отправляет сообщение, Shift+Enter добавляет новую строку
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? isProcessing
                  ? "Ожидайте ответа…"
                  : "Интервью завершено"
                : "Введите ваш ответ…"
            }
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            style={{
              minHeight: "48px",
              maxHeight: "200px",
              touchAction: "manipulation",
            }}
            aria-label="Введите ваше сообщение"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
            style={{ touchAction: "manipulation" }}
            aria-label="Отправить сообщение"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Нажмите Enter для отправки, Shift+Enter для новой строки
        </p>
      </form>
    </div>
  );
}
