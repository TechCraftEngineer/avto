"use client";

import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useMemo, useRef } from "react";
import { ChatMessage } from "~/components";

interface Message {
  id: string;
  sender: "ADMIN" | "BOT" | "CANDIDATE";
  contentType: string;
  content: string;
  createdAt: Date;
  fileUrl?: string | null;
  fileId?: string | null;
  voiceTranscription?: string | null;
}

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]);

  const groupedMessages = useMemo(
    () =>
      messages.reduce(
        (groups, message) => {
          const date = format(message.createdAt, "d MMMM yyyy", { locale: ru });
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(message);
          return groups;
        },
        {} as Record<string, Message[]>,
      ),
    [messages],
  );

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="px-2 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-muted px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-muted-foreground">
                  {date}
                </span>
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              {msgs.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={{
                    id: msg.id,
                    sender: msg.sender,
                    contentType: msg.contentType as "TEXT" | "VOICE",
                    content: msg.content,
                    createdAt: msg.createdAt,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
