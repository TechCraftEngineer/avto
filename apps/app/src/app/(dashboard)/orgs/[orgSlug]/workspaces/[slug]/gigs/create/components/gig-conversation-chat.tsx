"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { RotateCcw, Sparkles } from "lucide-react";
import React from "react";
import { ChatMessage, StreamingMessage, TypingIndicator } from "./chat-message";
import { QuizStepBlock } from "./quiz-step-block";
import type { ChatMessage as ChatMessageType } from "./types";

const WELCOME_MESSAGE: ChatMessageType = {
  id: "welcome",
  role: "assistant",
  content:
    "Привет! 👋 Какое задание нужно выполнить? Выберите вариант или опишите своими словами.",
  quickReplies: [
    "Создать лендинг",
    "Telegram-бот",
    "Дизайн логотипа",
    "Текст для сайта",
    "Монтаж видео",
    "Настроить рекламу",
  ],
};

interface GigConversationChatProps {
  messages: ChatMessageType[];
  isGenerating: boolean;
  /** Текст ответа бота в процессе стриминга */
  streamingMessage?: string;
  /** Quick replies, приходящие в процессе стриминга */
  streamingQuickReplies?: string[];
  onSendMessage: (content: string) => void;
  onReset: () => void;
}

export function GigConversationChat({
  messages,
  isGenerating,
  streamingMessage = "",
  streamingQuickReplies = [],
  onSendMessage,
  onReset,
}: GigConversationChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const allMessages = [WELCOME_MESSAGE, ...messages];
  const lastMessage = allMessages[allMessages.length - 1];
  const isLastAssistant = lastMessage?.role === "assistant";
  const currentStepOptions = isGenerating
    ? streamingQuickReplies
    : isLastAssistant
      ? (lastMessage.quickReplies ?? [])
      : [];

  const handleAnswer = React.useCallback(
    (value: string) => {
      if (isGenerating) return;
      onSendMessage(value);
    },
    [isGenerating, onSendMessage],
  );

  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!el) return;
    const id = window.setTimeout(() => {
      (el as HTMLElement).scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }, 150);
    return () => window.clearTimeout(id);
  }, [messages.length, isGenerating, streamingMessage]);

  const stepNumber = allMessages.filter((m) => m.role === "assistant").length;

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">Создание задания</CardTitle>
            <CardDescription>
              {stepNumber > 0
                ? `Шаг ${stepNumber} • Выберите или напишите`
                : "Quiz: выберите вариант или свой"}
            </CardDescription>
          </div>
          {messages.length > 0 && !isGenerating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-muted-foreground shrink-0"
              aria-label="Начать заново"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Заново
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator className="shrink-0" />
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="space-y-4 p-4">
          {allMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isDisabled={msg !== lastMessage}
              onQuickReply={msg === lastMessage ? handleAnswer : undefined}
            />
          ))}
          {isLastAssistant && !isGenerating && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <QuizStepBlock
                  question={lastMessage.content || "Чем могу помочь?"}
                  options={currentStepOptions}
                  onSelectOption={handleAnswer}
                  onCustomAnswer={handleAnswer}
                  disabled={isGenerating}
                  inputPlaceholder="Или напишите свой вариант…"
                  hideQuestion
                />
              </div>
            </div>
          )}
          {isGenerating &&
            (streamingMessage ? (
              <StreamingMessage
                content={streamingMessage}
                quickReplies={currentStepOptions}
                onSelectOption={handleAnswer}
              />
            ) : (
              <TypingIndicator />
            ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
