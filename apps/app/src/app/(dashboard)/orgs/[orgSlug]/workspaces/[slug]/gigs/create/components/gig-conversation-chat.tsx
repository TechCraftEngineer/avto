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
import { Bot, RotateCcw, Sparkles } from "lucide-react";
import React from "react";
import { ChatMessage, TypingIndicator } from "./chat-message";
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
  onSendMessage: (content: string) => void;
  onReset: () => void;
}

export function GigConversationChat({
  messages,
  isGenerating,
  onSendMessage,
  onReset,
}: GigConversationChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const allMessages = [WELCOME_MESSAGE, ...messages];
  const lastMessage = allMessages[allMessages.length - 1];
  const isLastAssistant = lastMessage?.role === "assistant";
  const currentStepOptions = isLastAssistant
    ? (lastMessage.quickReplies ?? [])
    : [];

  const handleAnswer = React.useCallback(
    (value: string) => {
      if (isGenerating) return;
      onSendMessage(value);
    },
    [isGenerating, onSendMessage],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when content changes
  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (el) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }, [messages.length, isGenerating]);

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
          {allMessages.slice(0, -1).map((msg) => (
            <ChatMessage key={msg.id} message={msg} isDisabled />
          ))}
          {lastMessage?.role === "user" && (
            <ChatMessage
              key={lastMessage.id}
              message={lastMessage}
              isDisabled
            />
          )}
          {isLastAssistant && !isGenerating && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <QuizStepBlock
                  question={lastMessage.content}
                  options={currentStepOptions}
                  onSelectOption={handleAnswer}
                  onCustomAnswer={handleAnswer}
                  disabled={isGenerating}
                  inputPlaceholder="Или напишите свой вариант…"
                />
              </div>
            </div>
          )}
          {isGenerating && <TypingIndicator />}
        </div>
      </ScrollArea>
    </Card>
  );
}
