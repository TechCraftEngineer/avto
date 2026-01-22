"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, MessageSquare, StickyNote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  triggerRefreshSingleResume,
  triggerScreenResponse,
  triggerSendWelcome,
} from "~/actions/trigger";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidate, FunnelCandidateDetail } from "../types";
import { ActivityTimeline } from "./activity-timeline";
import { CandidateInfo } from "./candidate-info";
import { ChatSection } from "./chat-section";
import { CommentsSection } from "./comments-section";
import { RejectDialog } from "./reject-dialog";
import { SendOfferDialog } from "./send-offer-dialog";
import { getStatusDisplay } from "./status-utils";

interface CandidateModalProps {
  candidate: FunnelCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CandidateModal({
  candidate,
  open,
  onOpenChange,
  workspaceId,
}: CandidateModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isSendingGreeting, setIsSendingGreeting] = useState(false);
  const [isRefreshingResume, setIsRefreshingResume] = useState(false);
  const [isRating, setIsRating] = useState(false);

  const {
    data: candidateDetail,
    isLoading: isLoadingDetail,
    error: candidateDetailError,
  } = useQuery({
    ...trpc.candidates.getById.queryOptions({
      workspaceId,
      candidateId: candidate?.id ?? "",
    }),
    enabled: open && !!candidate?.id,
    refetchInterval: isRating ? 1000 : false,
  });

  useEffect(() => {
    if (candidateDetailError) {
      console.error("Ошибка загрузки данных кандидата:", candidateDetailError);
      toast.error("Не удалось загрузить данные кандидата");
    }
  }, [candidateDetailError]);

  const fullCandidate: FunnelCandidateDetail | FunnelCandidate | null =
    candidateDetail ?? candidate;
  const photoUrl = useAvatarUrl(fullCandidate?.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, fullCandidate?.name ?? "Кандидат");
  const [activeTab, setActiveTab] = useState("chat");
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (
      isRating &&
      candidateDetail?.matchScore !== undefined &&
      candidateDetail.matchScore > 0
    ) {
      setIsRating(false);
    }
  }, [isRating, candidateDetail?.matchScore]);

  const { mutate: inviteCandidate, isPending: isInviting } = useMutation(
    trpc.candidates.inviteCandidate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.list.queryKey(),
        });
        if (fullCandidate) {
          queryClient.invalidateQueries({
            queryKey: trpc.candidates.getById.queryKey({
              workspaceId,
              candidateId: fullCandidate.id,
            }),
          });
        }
        toast.success("Кандидат приглашён");
      },
      onError: () => {
        toast.error("Не удалось пригласить кандидата");
      },
    }),
  );

  const handleSendGreeting = async () => {
    if (!fullCandidate?.telegram && !fullCandidate?.phone) {
      toast.error(
        "У кандидата не указаны ни Telegram username, ни номер телефона",
      );
      return;
    }

    setIsSendingGreeting(true);
    try {
      const result = await triggerSendWelcome(
        fullCandidate.id,
        fullCandidate.telegram,
        fullCandidate.phone,
      );
      if (!result.success) {
        toast.error("Не удалось отправить приветствие");
        return;
      }
      toast.success(
        `Приветствие отправлено ${fullCandidate.name ? fullCandidate.name : fullCandidate.telegram ? `@${fullCandidate.telegram}` : fullCandidate.phone}`,
      );
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.getById.queryKey({
          workspaceId,
          candidateId: fullCandidate.id,
        }),
      });
    } catch (error) {
      console.error("Ошибка отправки приветствия:", error);
      toast.error("Ошибка отправки приветствия");
    } finally {
      setIsSendingGreeting(false);
    }
  };

  const handleRefreshResume = async () => {
    if (!fullCandidate) return;

    setIsRefreshingResume(true);
    try {
      const result = await triggerRefreshSingleResume(fullCandidate.id);
      if (!result.success) {
        toast.error("Не удалось обновить резюме");
        return;
      }
      toast.success("Обновление резюме запущено");
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.getById.queryKey({
          workspaceId,
          candidateId: fullCandidate.id,
        }),
      });
    } catch (error) {
      console.error("Ошибка обновления резюме:", error);
      toast.error("Ошибка обновления резюме");
    } finally {
      setIsRefreshingResume(false);
    }
  };

  const handleRate = async () => {
    if (!fullCandidate) return;

    setIsRating(true);
    try {
      const result = await triggerScreenResponse(fullCandidate.id);
      if (!result.success) {
        toast.error("Не удалось запустить оценку");
        setIsRating(false);
        return;
      }
      toast.success("Оценка кандидата запущена");
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.getById.queryKey({
          workspaceId,
          candidateId: fullCandidate.id,
        }),
      });
    } catch (error) {
      console.error("Ошибка запуска оценки:", error);
      toast.error("Ошибка запуска оценки");
      setIsRating(false);
    }
  };

  if (!candidate || !fullCandidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-w-[90vw] h-[90vh] p-0 gap-0 flex flex-col overscroll-contain"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border shrink-0">
                <AvatarImage src={avatarUrl} alt={fullCandidate.name} />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {fullCandidate.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold truncate">
                  {fullCandidate.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {fullCandidate.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <MatchScoreCircle score={fullCandidate.matchScore} size="md" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {(() => {
              const statusDisplay = getStatusDisplay(
                candidateDetail?.status ?? fullCandidate?.status,
                candidateDetail?.hrSelectionStatus ??
                  fullCandidate?.hrSelectionStatus,
              );
              return (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Статус:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusDisplay.color}`}
                  >
                    {statusDisplay.label}
                  </span>
                </div>
              );
            })()}

            {isLoadingDetail ? (
              <div className="space-y-4">
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              </div>
            ) : candidateDetailError ? (
              <div className="space-y-4 text-center py-8">
                <p className="text-muted-foreground">
                  Не удалось загрузить полные данные кандидата
                </p>
              </div>
            ) : candidateDetail ? (
              <CandidateInfo
                candidate={candidateDetail}
                workspaceId={workspaceId}
                isLoading={{
                  sendGreeting: isSendingGreeting,
                  invite: isInviting,
                  refreshResume: isRefreshingResume,
                  rate: isRating,
                }}
                onAction={(action) => {
                  switch (action) {
                    case "send-greeting":
                      void handleSendGreeting();
                      break;
                    case "send-offer":
                      setShowOfferDialog(true);
                      break;
                    case "invite":
                      inviteCandidate({
                        candidateId: fullCandidate.id,
                        workspaceId,
                      });
                      break;
                    case "rate":
                      void handleRate();
                      break;
                    case "view-resume":
                      if (candidateDetail.resumePdfUrl) {
                        window.open(candidateDetail.resumePdfUrl, "_blank");
                      } else {
                        toast.error("Резюме недоступно");
                      }
                      break;
                    case "download-resume":
                      if (candidateDetail.resumePdfUrl) {
                        const link = document.createElement("a");
                        link.href = candidateDetail.resumePdfUrl;
                        link.download = `resume-${candidateDetail.name}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        toast.error("PDF резюме недоступно");
                      }
                      break;
                    case "refresh-resume":
                      void handleRefreshResume();
                      break;
                    case "reject":
                      setShowRejectDialog(true);
                      break;
                    default:
                      console.log("Unknown action:", action);
                  }
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              </div>
            )}

            <div className="border-t pt-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="w-full justify-start h-10 bg-transparent border-b rounded-none p-0">
                  <TabsTrigger
                    value="chat"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Чат
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Заметки
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    История
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="m-0 min-h-[400px]">
                  <ChatSection
                    candidateId={fullCandidate.id}
                    candidateName={fullCandidate.name}
                    workspaceId={workspaceId}
                  />
                </TabsContent>

                <TabsContent value="comments" className="m-0 min-h-[400px]">
                  <CommentsSection
                    candidateId={fullCandidate.id}
                    workspaceId={workspaceId}
                  />
                </TabsContent>

                <TabsContent value="activity" className="m-0 min-h-[400px]">
                  <ActivityTimeline
                    candidateId={fullCandidate.id}
                    workspaceId={workspaceId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>

      <SendOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        candidate={fullCandidate}
        workspaceId={workspaceId}
      />

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        candidate={fullCandidate}
        workspaceId={workspaceId}
      />
    </Dialog>
  );
}
