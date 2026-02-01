"use client";

import { getInitials } from "@qbs-autonaim/shared/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ScrollArea,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pause, Play, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAvatarUrl } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";

interface ChatSectionProps {
  candidateId: string;
  candidateName: string;
  workspaceId: string;
}

export function ChatSection({ candidateId, workspaceId }: ChatSectionProps) {
  const [messageText, setMessageText] = useState("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showTranscription, setShowTranscription] = useState<
    Record<string, boolean>
  >({});
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: messages = [] } = useQuery({
    ...trpc.candidates.listMessages.queryOptions({
      candidateId,
      workspaceId,
    }),
  });

  const sessionId = messages[0]?.interviewSessionId as string | undefined;

  const { mutate: sendMessage, isPending: isSending } = useMutation(
    trpc.telegram.send.send.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.listMessages.queryKey(),
        });
        setMessageText("");
        textareaRef.current?.focus();
        toast.success("Сообщение отправлено");
      },
      onError: () => {
        toast.error("Не удалось отправить сообщение");
      },
    }),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSend = async () => {
    if (!messageText.trim() || !sessionId) return;
    sendMessage({
      sessionId,
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setPlayingAudio(messageId);

      audioRef.current.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const toggleTranscription = (messageId: string) => {
    setShowTranscription((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  Начните диалог с кандидатом
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Сообщения появятся здесь
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
                            <AvatarImage
                              src={getAvatarUrl(
                                message.senderAvatar,
                                message.senderName,
                              )}
                              alt={message.senderName}
                            />
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
                          {message.type === "voice" && message.voiceUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 shrink-0 rounded-full hover:bg-background/80"
                                  onClick={() => {
                                    if (message.voiceUrl) {
                                      handlePlayAudio(
                                        message.id,
                                        message.voiceUrl,
                                      );
                                    }
                                  }}
                                  aria-label={
                                    playingAudio === message.id
                                      ? "Остановить"
                                      : "Воспроизвести"
                                  }
                                >
                                  {playingAudio === message.id ? (
                                    <Pause className="h-5 w-5" />
                                  ) : (
                                    <Play className="h-5 w-5 ml-0.5" />
                                  )}
                                </Button>
                                <div className="flex-1">
                                  <div className="h-8 flex items-center gap-1">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                      <div
                                        key={`wave-${message.id}-${i}`}
                                        className="w-1 bg-primary/40 rounded-full"
                                        style={{
                                          height: `${Math.random() * 24 + 8}px`,
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                  {formatDuration(message.voiceDuration ?? 0)}
                                </span>
                              </div>
                              {message.voiceTranscription && (
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleTranscription(message.id)
                                    }
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {showTranscription[message.id]
                                      ? "Скрыть текст"
                                      : "Показать текст"}
                                  </button>
                                  {showTranscription[message.id] && (
                                    <p className="text-sm leading-relaxed text-muted-foreground pt-1 border-t">
                                      {message.voiceTranscription}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
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

      <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
              disabled={!messageText.trim() || isSending || !sessionId}
              aria-label="Отправить сообщение"
              className="h-[44px] w-[44px] shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            ⌘/Ctrl + Enter для отправки
          </p>
        </div>
      </div>
    </div>
  );
}
