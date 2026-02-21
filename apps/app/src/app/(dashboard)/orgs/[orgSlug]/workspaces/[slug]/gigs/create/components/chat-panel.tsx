"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area"
import { Separator } from "@qbs-autonaim/ui/components/separator"
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import React from "react";
import { ChatMessage, TypingIndicator } from "./chat-message";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatPanelProps {
  messages: ChatMessageType[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickReply: (reply: string) => void;
  isThinking: boolean;
  isDisabled: boolean;
}

export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onQuickReply,
  isThinking,
  isDisabled,
}: ChatPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const messagesLen = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (el) el.scrollTop = el.scrollHeight;
  }, [messagesLen, isThinking]);

  React.useEffect(() => {
    if (!isThinking && inputRef.current) inputRef.current.focus();
  }, [isThinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (inputValue.trim() && !isDisabled) {
        e.preventDefault();
        onSend();
      }
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Помощник</CardTitle>
            <CardDescription>Опишите задачу своими словами</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onQuickReply={onQuickReply}
              isDisabled={isDisabled}
            />
          ))}
          {isThinking && <TypingIndicator />}
        </div>
      </ScrollArea>

      <Separator />
      <div className="p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите, что нужно сделать…"
            className="min-h-[60px] resize-none text-sm"
            disabled={isDisabled}
          />
          <Button
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
            onClick={onSend}
            disabled={!inputValue.trim() || isDisabled}
            aria-label="Отправить сообщение"
          >
            {isThinking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ⌘/Ctrl&nbsp;+&nbsp;Enter для отправки
        </p>
      </div>
    </Card>
  );
}
