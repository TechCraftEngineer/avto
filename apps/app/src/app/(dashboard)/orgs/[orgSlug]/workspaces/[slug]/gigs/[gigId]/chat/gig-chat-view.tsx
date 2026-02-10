"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChatInput,
  ChatMessageList,
  TypingIndicator,
} from "~/components/chat/components";
import { useAIChatStream } from "~/hooks/use-ai-chat-stream";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";
import { type AIChatMessage, getMessageText } from "~/types/ai-chat";

interface GigChatViewProps {
  gigId: string;
  sessionId: string;
}

export function GigChatView({ gigId, sessionId }: GigChatViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;

  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const historyInitializedRef = useRef(false);

  const { data: gig } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
    staleTime: 30000,
  });

  const historyQuery = useQuery(
    trpc.chat.getHistory.queryOptions({
      sessionId,
      limit: 50,
    }),
  );

  const {
    messages: streamMessages,
    status: streamStatus,
    sendMessage: sendStreamMessage,
    setMessages: setStreamMessages,
  } = useAIChatStream({
    apiEndpoint: "/api/chat/stream",
    initialMessages: [],
    chatId: sessionId,
    onError: (err) => {
      toast.error("Ошибка чата", {
        description: err.message || "Не удалось получить ответ",
      });
    },
    onFinish: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.chat.listSessions.queryKey({
          entityType: "gig",
          entityId: gigId,
          limit: 20,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.chat.getHistory.queryKey({
          sessionId,
          limit: 50,
        }),
      });
    },
  });

  const clearHistoryMutation = useMutation(
    trpc.chat.clearHistory.mutationOptions({
      onSuccess: () => {
        setStreamMessages([]);
        setLastFailedMessage(null);
        historyInitializedRef.current = false;
        queryClient.invalidateQueries({
          queryKey: trpc.chat.listSessions.queryKey({
            entityType: "gig",
            entityId: gigId,
            limit: 20,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.chat.getHistory.queryKey({
            sessionId,
            limit: 50,
          }),
        });
      },
      onError: (err) => {
        toast.error("Не удалось очистить историю", {
          description: err.message,
        });
      },
    }),
  );

  useEffect(() => {
    if (historyInitializedRef.current) return;
    if (streamStatus !== "idle") return;
    if (!historyQuery.data?.messages) return;

    const normalized: AIChatMessage[] = historyQuery.data.messages
      .filter(
        (m): m is typeof m & { role: "user" | "assistant" } =>
          m.role === "user" || m.role === "assistant",
      )
      .map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content ?? "" }],
        createdAt: m.createdAt,
      }));

    setStreamMessages(normalized);
    historyInitializedRef.current = true;
  }, [historyQuery.data?.messages, setStreamMessages, streamStatus]);

  const uiMessages = useMemo(() => {
    return streamMessages
      .filter(
        (m): m is typeof m & { role: "user" | "assistant" } =>
          m.role === "user" || m.role === "assistant",
      )
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: getMessageText(m),
        createdAt: m.createdAt,
        sender: (m.role === "assistant" ? "BOT" : "CANDIDATE") as
          | "BOT"
          | "CANDIDATE",
        contentType: "TEXT" as const,
      }));
  }, [streamMessages]);

  const isLoading =
    streamStatus === "submitted" || streamStatus === "streaming";

  const handleSendMessage = async (message: string) => {
    try {
      setLastFailedMessage(null);
      await sendStreamMessage(message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastFailedMessage(message);
      toast.error("Не удалось отправить сообщение", {
        description: msg,
      });
    }
  };

  const gigTitle = useMemo(() => {
    return gig?.title ?? "Задание";
  }, [gig?.title]);

  if (!orgSlug || !workspaceSlug) {
    return null;
  }

  const gigHref = `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`;

  return (
    <div className="flex h-full bg-background">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0">
          <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-3 px-4 py-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:hidden"
              >
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/chat`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:hidden"
              >
                <Link href={gigHref}>
                  <ExternalLink className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">AI Помощник</div>
                <Link
                  href={gigHref}
                  className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors"
                >
                  {gigTitle}
                </Link>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href={gigHref}>
                  <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />К
                  заданию
                </Link>
              </Button>

              {uiMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearHistoryMutation.mutate({ sessionId })}
                  disabled={isLoading || clearHistoryMutation.isPending}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
                  aria-label="Очистить историю"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ChatMessageList
            messages={uiMessages}
            isLoading={historyQuery.isLoading && uiMessages.length === 0}
          />
        </div>

        {isLoading && <TypingIndicator />}

        {lastFailedMessage && !isLoading && (
          <div className="border-t bg-muted/30 p-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage(lastFailedMessage)}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Повторить
            </Button>
          </div>
        )}

        <div className="shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Спросите что-нибудь…"
          />
        </div>
      </div>
    </div>
  );
}
