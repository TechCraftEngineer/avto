"use client";

import { cn } from "@qbs-autonaim/ui";
import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/**
 * ChatMessageList - Displays chat messages with markdown support
 * Requirements: 8.2, 8.4, 8.6
 * Subtask 7.2: Message list with user/assistant separation, markdown, and auto-scroll
 */
export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message (Requirement 8.6)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Загрузка истории…</p>
        </div>
      </div>
    );
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <Bot className="text-muted-foreground/50 mx-auto h-12 w-12" />
          <h3 className="mt-4 text-base font-medium">Начните диалог</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Задайте вопрос о кандидатах, например:
          </p>
          <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
            <li>• Кто лучший кандидат?</li>
            <li>• Покажи топ-3 кандидатов</li>
            <li>• Кто укладывается в бюджет?</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gray-50 p-4"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
}

/**
 * ChatMessageItem - Individual message component with markdown support
 * Requirements: 8.2, 8.4
 */
function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 flex gap-3 rounded-lg p-4 transition-all duration-200",
        isUser ? "bg-primary/5" : "bg-white shadow-sm",
      )}
      aria-label={`Сообщение от ${isUser ? "вас" : "ассистента"}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="text-sm font-medium">
          {isUser ? "Вы" : "AI Помощник"}
        </span>
        <div className="prose prose-sm max-w-none">
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed">
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
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="mb-2 overflow-x-auto rounded-lg bg-gray-100 p-3">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
