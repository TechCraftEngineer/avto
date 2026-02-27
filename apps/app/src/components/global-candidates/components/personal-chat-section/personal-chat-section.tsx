"use client";

import { getInitials } from "@qbs-autonaim/shared";
import { Avatar, AvatarFallback } from "@qbs-autonaim/ui/components/avatar";
import { Button } from "@qbs-autonaim/ui/components/button";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

interface PersonalChatSectionProps {
  candidateId: string;
  candidateName: string;
  organizationId: string;
  telegramUsername?: string | null;
}

export function PersonalChatSection({
  candidateId,
  candidateName: _candidateName,
  organizationId,
  telegramUsername,
}: PersonalChatSectionProps) {
  const [messageText, setMessageText] = useState("");
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [] } = useQuery(
    candidateId && organizationId
      ? orpc.personalTelegram.listMessages.queryOptions({
          input: { candidateId, organizationId },
        })
      : skipToken,
  );

  const { data: sessions = [] } = useQuery({
    ...orpc.personalTelegram.getSessions.queryOptions(),
  });

  const hasPersonalTelegram = sessions.length > 0;
  const canSend = hasPersonalTelegram && !!telegramUsername;

  const { mutate: sendMessage, isPending: isSending } = useMutation(
    orpc.personalTelegram.sendMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.personalTelegram.listMessages.queryKey({
            input: { candidateId, organizationId },
          }),
        });
        setMessageText("");
        textareaRef.current?.focus();
        toast.success("Сообщение отправлено");
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось отправить сообщение");
      },
    }),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages триггерит прокрутку вниз при новых сообщениях
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | undefined;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !canSend) return;
    sendMessage({
      candidateId,
      organizationId,
      content: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return messageDate.toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!hasPersonalTelegram) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">
          Подключите личный Telegram для переписки
        </p>
        <p className="text-xs mt-1">Настройки → Интеграции → Личный Telegram</p>
        <Button variant="link" className="mt-2" asChild>
          <a href="/account/settings/integrations">Настроить</a>
        </Button>
      </div>
    );
  }

  if (!telegramUsername) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">У кандидата не указан Telegram</p>
        <p className="text-xs mt-1">Добавьте @username в профиль кандидата</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  Начните диалог с кандидатом
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Сообщения отправляются через ваш личный Telegram
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const showAvatar =
                    index === 0 ||
                    messages[index - 1]?.sender !== message.sender;
                  return (
                    <div key={message.id} className="flex gap-2">
                      <div className="w-8 shrink-0">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(message.senderName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        {showAvatar && (
                          <span className="text-xs font-medium text-muted-foreground px-3">
                            {message.senderName}
                          </span>
                        )}
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70 px-3">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background/95 backdrop-blur">
        <div className="p-3">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder="Написать сообщение…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              autoComplete="off"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              aria-label="Отправить сообщение"
              className="h-[44px] w-[44px] shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            ⌘/Ctrl + Enter для отправки · Через @{telegramUsername}
          </p>
        </div>
      </div>
    </div>
  );
}
