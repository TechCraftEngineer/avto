"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { GigResponseDetailCard } from "~/components/gig/response-detail/detail-card";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
    gigId: string;
    responseId: string;
  }>;
}

function ResponseDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:py-6 sm:px-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-4 w-32" />

      <Card>
        <CardContent>
          <div className="flex items-start gap-3 sm:gap-4">
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
              <Skeleton className="h-4 w-36 sm:w-48" />
            </div>
            <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton className="h-24 sm:h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function GigResponseDetailPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId, responseId } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [messageDialog, setMessageDialog] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: "accept" | "reject";
  }>({ open: false, action: "accept" });
  const [isPolling, setIsPolling] = React.useState(false);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch response details
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.gig.responses.get.queryOptions({
      responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Приводим к GigResponse типу
  const gigResponse = response
    ? {
        ...response,
        entityType: "gig" as const,
        // Гарантируем gig-специфичные поля
        proposedPrice: response.proposedPrice ?? null,
        proposedDeliveryDays: response.proposedDeliveryDays ?? null,
        portfolioLinks: response.portfolioLinks ?? null,
        portfolioFileId: response.portfolioFileId ?? null,
        compositeScore: response.compositeScore ?? null,
        priceScore: response.priceScore ?? null,
        deliveryScore: response.deliveryScore ?? null,
        skillsMatchScore: response.skillsMatchScore ?? null,
        experienceScore: response.experienceScore ?? null,
        compositeScoreReasoning: response.compositeScoreReasoning ?? null,
        priceScoreReasoning: response.priceScoreReasoning ?? null,
        deliveryScoreReasoning: response.deliveryScoreReasoning ?? null,
        skillsMatchScoreReasoning: response.skillsMatchScoreReasoning ?? null,
        experienceScoreReasoning: response.experienceScoreReasoning ?? null,
      }
    : null;

  // Accept mutation
  const acceptMutation = useMutation(
    trpc.gig.responses.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.get.queryKey({
            responseId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик принят");
        setConfirmDialog({ open: false, action: "accept" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Reject mutation
  const rejectMutation = useMutation(
    trpc.gig.responses.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.get.queryKey({
            responseId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик отклонен");
        setConfirmDialog({ open: false, action: "reject" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    trpc.gig.responses.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Сообщение отправлено");
        setMessageDialog(false);
        setMessageText("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start polling for updated data
  const startPolling = React.useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsPolling(true);
    let pollCount = 0;
    const maxPolls = 12; // 12 попыток * 5 секунд = 1 минута

    pollingIntervalRef.current = setInterval(() => {
      pollCount++;

      queryClient.invalidateQueries({
        queryKey: trpc.gig.responses.get.queryKey({
          responseId,
          workspaceId: workspace?.id ?? "",
        }),
      });

      // Остановить polling через 1 минуту
      if (pollCount >= maxPolls) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
      }
    }, 5000);
  }, [queryClient, responseId, workspace?.id, trpc.gig.responses.get]);

  // Stop polling when interview scoring appears
  React.useEffect(() => {
    if (gigResponse?.interviewSession && isPolling) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
      toast.success("Оценка кандидата завершена");
    }
  }, [gigResponse?.interviewSession, isPolling]);

  // Evaluate mutation
  const evaluateMutation = useMutation(
    trpc.gig.responses.evaluate.mutationOptions({
      onSuccess: () => {
        toast.success("Пересчёт рейтинга запущен");
        startPolling();
      },
      onError: (error) => {
        toast.error(`Ошибка пересчёта: ${error.message}`);
      },
    }),
  );

  const handleAccept = () => {
    setConfirmDialog({ open: true, action: "accept" });
  };

  const handleReject = () => {
    setConfirmDialog({ open: true, action: "reject" });
  };

  const handleMessage = () => {
    setMessageDialog(true);
  };

  const handleEvaluate = () => {
    if (!workspace?.id) return;

    evaluateMutation.mutate({
      responseId,
      workspaceId: workspace.id,
    });
  };

  const handleConfirmAction = () => {
    if (!workspace?.id) return;

    if (confirmDialog.action === "accept") {
      acceptMutation.mutate({
        responseId,
        workspaceId: workspace.id,
      });
    } else {
      rejectMutation.mutate({
        responseId,
        workspaceId: workspace.id,
      });
    }
  };

  const handleSendMessage = () => {
    if (!workspace?.id || !messageText.trim()) return;

    sendMessageMutation.mutate({
      responseId,
      workspaceId: workspace.id,
      message: messageText.trim(),
    });
  };

  const isProcessing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    sendMessageMutation.isPending ||
    evaluateMutation.isPending;

  if (isLoading || !workspace?.id) {
    return <ResponseDetailSkeleton />;
  }

  if (isError || !gigResponse) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 sm:py-16 sm:px-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Отклик не найден</CardTitle>
            <CardDescription>
              Отклик, который вы ищете, не существует или был удалён
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button asChild className="min-h-[44px] touch-action-manipulation">
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Вернуться к откликам
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-4 px-4 sm:py-6 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 px-2 -ml-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
        >
          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к откликам
          </Link>
        </Button>
      </div>

      {/* Response Detail */}
      <GigResponseDetailCard
        response={gigResponse}
        onAccept={handleAccept}
        onReject={handleReject}
        onMessage={handleMessage}
        onEvaluate={handleEvaluate}
        isProcessing={isProcessing}
        isPolling={isPolling}
      />

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {confirmDialog.action === "accept"
                ? "Принять отклик?"
                : "Отклонить отклик?"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {confirmDialog.action === "accept"
                ? "Вы уверены, что хотите принять этот отклик? Кандидат будет уведомлен."
                : "Вы уверены, что хотите отклонить этот отклик? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              Отмена
            </Button>
            <Button
              variant={
                confirmDialog.action === "accept" ? "default" : "destructive"
              }
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {confirmDialog.action === "accept" ? "Принять" : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Отправить сообщение
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base break-words">
              Напишите сообщение кандидату{" "}
              {gigResponse?.candidateName || gigResponse?.candidateId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Введите ваше сообщение…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              className="resize-none text-base sm:text-sm"
              style={{ fontSize: "16px" }}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setMessageDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !messageText.trim()}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
