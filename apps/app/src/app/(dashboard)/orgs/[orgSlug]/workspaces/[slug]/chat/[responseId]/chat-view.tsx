"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { paths } from "@qbs-autonaim/config";
import Button from "@qbs-autonaim/ui/button";
import Sheet from "@qbs-autonaim/ui/sheet";
import SheetContent from "@qbs-autonaim/ui/sheetcontent";
import SheetTrigger from "@qbs-autonaim/ui/sheettrigger";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchTelegramMessagesToken } from "~/actions/realtime";
import {
  ChatError,
  ChatHeader,
  ChatInput,
  ChatLoading,
  ChatMessages,
  ChatSidebar,
} from "~/components/chat";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export function ChatView({ conversationId }: { conversationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspaceId } = useWorkspaceContext();
  const [_transcribingMessageId, setTranscribingMessageId] = useState<
    string | null
  >(null);
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: currentConversation } = useQuery({
    ...trpc.telegram.conversation.getById.queryOptions({
      id: conversationId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
    staleTime: 30000,
  });

  const metadata =
    currentConversation?.metadata &&
    typeof currentConversation.metadata === "string"
      ? JSON.parse(currentConversation.metadata)
      : null;
  const candidateResponseId = metadata?.responseId;

  const { data: responseData } = useQuery({
    ...trpc.vacancy.responses.get.queryOptions({
      id: candidateResponseId ?? "",
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(candidateResponseId) && Boolean(workspaceId),
    staleTime: 60000,
  });

  const { data: _companyData } = useQuery({
    ...trpc.bot.get.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
    staleTime: 300000,
  });

  const {
    data: messages = [],
    isPending,
    error,
  } = useQuery({
    ...trpc.telegram.messages.getByConversationId.queryOptions({
      sessionId: conversationId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(conversationId) && Boolean(workspaceId),
  });

  const subscription = useInngestSubscription({
    refreshToken: () => fetchTelegramMessagesToken(conversationId),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (subscription.latestData?.kind === "data") {
      queryClient.invalidateQueries({
        queryKey: [
          ["telegram", "messages", "getByConversationId"],
          { input: { conversationId }, type: "query" },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [["telegram", "conversation", "getAll"]],
      });
    }
  }, [subscription.latestData, conversationId, queryClient]);

  const sendMessageMutationOptions = trpc.telegram.send.send.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ["telegram", "messages", "getByConversationId"],
          { input: { sessionId: conversationId }, type: "query" },
        ],
      });
    },
    onError: (error) => {
      toast.error("Ошибка отправки сообщения", {
        description: error.message || "Не удалось отправить сообщение",
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation(
    sendMessageMutationOptions,
  );

  const transcribeVoiceMutationOptions =
    trpc.telegram.transcribe.trigger.mutationOptions({
      onSuccess: () => {
        if (toastId) {
          toast.success("Транскрибация запущена", {
            id: toastId,
            description: "Результат появится через несколько секунд",
          });
        }
        queryClient.invalidateQueries({
          queryKey: [
            ["telegram", "messages", "getByConversationId"],
            { input: { sessionId: conversationId }, type: "query" },
          ],
        });
        setTranscribingMessageId(null);
        setToastId(null);
      },
      onError: (error) => {
        if (toastId) {
          toast.error("Ошибка транскрибации", {
            id: toastId,
            description: error.message || "Не удалось запустить транскрибацию",
          });
        }
        setTranscribingMessageId(null);
        setToastId(null);
      },
    });

  const { mutate: transcribeVoice } = useMutation(
    transcribeVoiceMutationOptions,
  );

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !conversationId) return;

    sendMessage({
      sessionId: conversationId,
      content: message,
    });
  };

  const _handleTranscribe = (messageId: string, fileId: string) => {
    setTranscribingMessageId(messageId);
    const id = toast.loading("Запуск транскрибации...");
    setToastId(id);
    transcribeVoice({ messageId, fileId });
  };

  if (isPending) {
    return <ChatLoading />;
  }

  if (error || !currentConversation) {
    return <ChatError message={error?.message} />;
  }

  return (
    <div className="flex h-full bg-background">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0">
          <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-3 px-4 py-3">
              <Link
                href={paths.workspace.chat(orgSlug ?? "", workspaceSlug ?? "")}
                className="md:hidden"
              >
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              <div className="flex-1 min-w-0">
                <ChatHeader
                  candidateName="Кандидат"
                  candidateEmail={responseData?.chatId ?? undefined}
                />
              </div>

              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-0">
                  <ChatSidebar
                    candidateName={null}
                    chatId={responseData?.chatId ?? ""}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-muted/30">
          <ChatMessages
            messages={messages.map(
              (msg) =>
                ({
                  id: msg.id,
                  sender:
                    msg.role === "user"
                      ? "CANDIDATE"
                      : msg.role === "assistant"
                        ? "BOT"
                        : "ADMIN",
                  contentType: msg.type === "voice" ? "VOICE" : "TEXT",
                  content: msg.content ?? "",
                  createdAt: msg.createdAt,
                  fileUrl: msg.fileUrl,
                  fileId: msg.fileId,
                  voiceTranscription: msg.voiceTranscription,
                }) as const,
            )}
          />
        </div>

        <div className="shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isSending}
            isProcessing={isSending}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <ChatSidebar candidateName={null} chatId={responseData?.chatId ?? ""} />
      </div>
    </div>
  );
}

