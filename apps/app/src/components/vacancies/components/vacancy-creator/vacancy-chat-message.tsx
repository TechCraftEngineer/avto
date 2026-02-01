"use client";

import { cn } from "@qbs-autonaim/ui";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Bot, User } from "lucide-react";

interface VacancyChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function VacancyChatMessage({
  role,
  content,
  timestamp,
}: VacancyChatMessageProps) {
  const isUser = role === "user";

  return (
    <article
      className={cn(
        "flex gap-3 rounded-lg p-4",
        isUser ? "bg-primary/5" : "bg-muted/50",
      )}
      aria-label={`Сообщение от ${isUser ? "вас" : "ассистента"}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? "Вы" : "Ассистент"}
          </span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={timestamp.toISOString()}
          >
            {format(timestamp, "HH:mm", { locale: ru })}
          </time>
        </div>
        <p className="min-w-0 break-words whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </p>
      </div>
    </article>
  );
}
