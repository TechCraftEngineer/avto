"use client";

import { cn } from "@qbs-autonaim/ui/utils";

interface Message {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === "BOT";
  const time = new Date(message.createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
      aria-label={`Сообщение от ${isBot ? "ассистента" : "вас"}`}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
          isBot
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
        <time
          className={cn(
            "mt-1 block text-xs",
            isBot ? "text-muted-foreground" : "text-primary-foreground/80",
          )}
          dateTime={new Date(message.createdAt).toISOString()}
        >
          {time}
        </time>
      </div>
    </article>
  );
}
