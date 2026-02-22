"use client";

import { useChat } from "@ai-sdk/react";
import { cn } from "@qbs-autonaim/ui/utils";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { AlertCircle, Sparkles } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useVoiceUpload } from "~/hooks/use-voice-upload";
import {
  convertHistoryMessage,
  convertToSDKMessage,
  convertUIMessage,
} from "~/lib/message-converters";
import { useORPC } from "~/orpc/react";
import type { ChatMessage, ChatStatus } from "~/types/chat";
import { AIChatInput } from "./ai-chat-input";
import { InterviewGreeting } from "./chat/interview-greeting";
import { LoadingScreen } from "./chat/loading-screen";
import { MessagesList } from "./chat/messages-list";
import { InterviewContextCard } from "./interview-context-card";

function generateUUID(): string {
  return crypto.randomUUID();
}

interface InterviewChatProps {
  interviewSessionId: string;
  interviewToken?: string;
  apiEndpoint?: string;
  className?: string;
}

function PureInterviewChat({
  interviewSessionId,
  interviewToken,
  apiEndpoint = "/api/interview/chat/stream",
  className,
}: InterviewChatProps) {
  const orpc = useORPC();
  const isInitializedRef = useRef(false);
  const currentConversationIdRef = useRef(interviewSessionId);

  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery(
    orpc.freelancePlatforms.getChatHistory.queryOptions({
      interviewSessionId,
      interviewToken,
    }),
  );

  const { data: interviewContext, isLoading: isLoadingContext } = useQuery({
    ...orpc.freelancePlatforms.getInterviewContext.queryOptions({
      interviewSessionId,
      interviewToken,
    }),
    enabled: !!chatHistory,
  });

  const historyMessages = useMemo(() => {
    if (!chatHistory?.messages) return [];
    return chatHistory.messages.map(convertHistoryMessage);
  }, [chatHistory?.messages]);

  // Определяем entityType из interviewContext
  const entityType = useMemo(() => {
    if (!interviewContext) return "vacancy";
    return interviewContext.type === "gig" ? "gig" : "vacancy";
  }, [interviewContext]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        body: {
          sessionId: interviewSessionId,
          interviewToken: interviewToken || null,
          entityType, // Передаем entityType в body запроса
        },
      }),
    [apiEndpoint, interviewSessionId, interviewToken, entityType],
  );

  const {
    messages: rawMessages,
    status: rawStatus,
    error,
    sendMessage,
    stop,
    setMessages,
  } = useChat({
    id: interviewSessionId,
    experimental_throttle: 50,
    generateId: generateUUID,
    transport,
    onError: (_err) => {
      // Error handling
    },
  });

  const status: ChatStatus = useMemo(() => {
    if (rawStatus === "submitted") return "submitted";
    if (rawStatus === "streaming") return "streaming";
    if (rawStatus === "error") return "error";
    return "idle";
  }, [rawStatus]);

  const messages: ChatMessage[] = useMemo(() => {
    return rawMessages.map(convertUIMessage);
  }, [rawMessages]);

  useEffect(() => {
    if (currentConversationIdRef.current !== interviewSessionId) {
      isInitializedRef.current = false;
      currentConversationIdRef.current = interviewSessionId;
    }

    if (!isInitializedRef.current && historyMessages.length > 0) {
      const sdkMessages = historyMessages.map(convertToSDKMessage);

      if (rawMessages.length > 0) {
        setMessages([]);
        setTimeout(() => {
          setMessages(sdkMessages);
          isInitializedRef.current = true;
        }, 0);
      } else {
        setMessages(sdkMessages);
        isInitializedRef.current = true;
      }
    }
  }, [interviewSessionId, historyMessages, rawMessages.length, setMessages]);

  const { uploadVoice } = useVoiceUpload({
    sessionId: interviewSessionId,
    onSuccess: (audioUrl) => {
      sendMessage({
        role: "user",
        parts: [
          {
            type: "file" as const,
            url: audioUrl,
            mediaType: "audio/webm",
          },
        ],
      });
    },
  });

  const handleSendMessage = useCallback(
    async (content: string, audioFile?: File) => {
      if (audioFile) {
        await uploadVoice(audioFile);
        return;
      }

      if (!content.trim()) return;

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: content }],
      });
    },
    [uploadVoice, sendMessage],
  );

  const chatStatus = chatHistory?.status || "active";
  const isCompleted = chatStatus === "completed";
  const isCancelled = chatStatus === "cancelled";
  const isReadonly = isCompleted || isCancelled;

  if (isLoadingHistory || isLoadingContext) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 touch-pan-y flex-col bg-muted/30",
        className,
      )}
    >
      <header className="sticky top-0 z-10 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {interviewContext && (
              <h1 className="truncate font-semibold text-base">
                {interviewContext.title}
              </h1>
            )}
            <p className="text-muted-foreground text-xs">
              {isCompleted && "Завершено"}
              {isCancelled && "Отменено"}
              {!isReadonly &&
                (rawStatus === "streaming" ? "Генерирую…" : "Онлайн")}
            </p>
          </div>
        </div>
      </header>

      {interviewContext && (
        <div className="shrink-0 border-b bg-background">
          <div className="mx-auto w-full max-w-4xl">
            <InterviewContextCard
              context={interviewContext}
              entityType={entityType}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="shrink-0 border-b bg-background">
          <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6">
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm"
              role="alert"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <p className="flex-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      <MessagesList
        messages={messages}
        status={status}
        emptyStateComponent={<InterviewGreeting entityType={entityType} />}
      />

      <div className="sticky bottom-0 z-10 shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex w-full max-w-4xl gap-2 px-4 py-3 sm:px-6 sm:py-4">
          {!isReadonly && (
            <AIChatInput
              onSendMessage={handleSendMessage}
              onStop={stop}
              status={status}
              enableVoice={true}
              placeholder={
                status === "streaming"
                  ? "Ожидайте ответа…"
                  : "Напишите сообщение…"
              }
            />
          )}
        </div>
      </div>

      {isReadonly && (
        <div className="shrink-0 border-t bg-muted/50">
          <div className="mx-auto w-full max-w-4xl px-4 py-4 text-center text-muted-foreground text-sm sm:px-6">
            {isCompleted && "Интервью завершено. Спасибо за участие!"}
            {isCancelled && "Интервью было отменено."}
          </div>
        </div>
      )}
    </div>
  );
}

export const InterviewChat = memo(PureInterviewChat);
