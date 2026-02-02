"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { cn } from "@qbs-autonaim/ui";
import { ScrollArea } from "@qbs-autonaim/ui/scroll-area";
import { Bot, Mic, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | null;
  type: "text" | "voice" | "file" | "event";
  voiceTranscription: string | null;
  createdAt: Date;
}

interface Conversation {
  id: string;
  status: string;
  messages: Message[];
}

interface DialogTabProps {
  conversation: Conversation;
}

// Кастомные компоненты для рендеринга Markdown
const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-muted p-3">
      {children}
    </pre>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:no-underline"
    >
      {children}
    </a>
  ),
};

export function DialogTab({ conversation }: DialogTabProps) {
  return (
    <ScrollArea className="h-[400px] sm:h-[600px] pr-2 sm:pr-4">
      <div className="space-y-4 sm:space-y-6">
        {conversation.messages.map((message) => (
          <DialogMessage key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  );
}

function DialogMessage({ message }: { message: Message }) {
  const isCandidate = message.role === "user";
  const isVoice = message.type === "voice";

  // Пропускаем сообщения без контента (кроме голосовых с транскрипцией)
  if (!message.content && !(isVoice && message.voiceTranscription)) {
    return null;
  }

  // Валидация даты
  const messageDate = new Date(message.createdAt);
  const isValidDate = !Number.isNaN(messageDate.getTime());
  const formattedTime = isValidDate
    ? new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(messageDate)
    : null;

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4",
        isCandidate ? "flex-row" : "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full",
          isCandidate ? "bg-muted" : "bg-primary/5",
        )}
      >
        {isCandidate ? (
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        ) : (
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        )}
      </div>

      <div
        className={cn(
          "flex-1 space-y-1.5 min-w-0",
          isCandidate ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            isCandidate ? "flex-row" : "flex-row-reverse",
          )}
        >
          <span
            className={cn(isCandidate ? "text-foreground" : "text-primary")}
          >
            {isCandidate ? "Кандидат" : "AI Ассистент"}
          </span>
          {formattedTime && (
            <span className="text-muted-foreground">{formattedTime}</span>
          )}
        </div>

        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 sm:px-4 sm:py-3 max-w-[85%] sm:max-w-[75%]",
            isCandidate
              ? "bg-muted text-foreground"
              : "bg-accent text-foreground",
          )}
        >
          {isVoice && message.voiceTranscription ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Mic className="h-3 w-3" />
                Голосовое сообщение
              </Badge>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                <ReactMarkdown components={markdownComponents}>
                  {message.voiceTranscription}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed">
              <ReactMarkdown components={markdownComponents}>
                {message.content ?? ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

