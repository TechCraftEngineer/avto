"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  GigResponseActionButtons,
  MessageDialog,
  ResponseHeader,
  ResponsesFilters,
  ResponsesTable,
  useResponseFilters,
  useResponseMutations,
  useResponseStats,
} from "~/components/gig/components/gig-responses";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

export function ResponsesSkeleton() {
  return (
    <div className="container mx-auto max-w-[1600px] w-full py-4 px-4 sm:py-6 sm:px-6">
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 sm:h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((id) => (
                  <TableRow key={`skeleton-${id}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GigResponsesPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [messageText, setMessageText] = React.useState("");

  const [messageDialog, setMessageDialog] = React.useState<{
    open: boolean;
    responseId: string;
    candidateName?: string | null;
  }>({ open: false, responseId: "", candidateName: "" });

  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    responseId: string;
    action: "accept" | "reject";
    candidateName?: string | null;
  }>({ open: false, responseId: "", action: "accept", candidateName: "" });

  // Fetch gig info
  const {
    data: gig,
    isLoading: isGigLoading,
    isError: isGigError,
  } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Fetch responses
  const { data: responses, isLoading } = useQuery({
    ...trpc.gig.responses.list.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Transform responses to include score
  const responsesWithScore = React.useMemo(() => {
    return (
      responses?.map((response) => ({
        ...response,
        score: response.interviewScoring
          ? (response.interviewScoring.rating ??
            Math.round(response.interviewScoring.score / 20))
          : null,
      })) || []
    );
  }, [responses]);

  // Custom hooks
  const { filteredResponses } = useResponseFilters({
    responses: responsesWithScore,
    searchQuery,
    statusFilter,
  });

  const stats = useResponseStats(responses);

  const syncMutation = useMutation(
    trpc.freelancePlatforms.syncGigResponses.mutationOptions({
      onSuccess: () => {
        toast.success("Синхронизация откликов запущена");
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.count.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Ошибка синхронизации");
      },
    }),
  );

  const analyzeMutation = useMutation(
    trpc.gig.responses.recalculateRanking.mutationOptions({
      onSuccess: () => {
        toast.success("Анализ откликов запущен");
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.ranked.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось запустить анализ");
      },
    }),
  );

  const handleSync = React.useCallback(() => {
    if (workspace?.id) {
      syncMutation.mutate({ gigId, workspaceId: workspace.id });
    }
  }, [workspace?.id, gigId, syncMutation]);

  const handleAnalyze = React.useCallback(() => {
    if (workspace?.id) {
      analyzeMutation.mutate({ gigId, workspaceId: workspace.id });
    }
  }, [workspace?.id, gigId, analyzeMutation]);

  const { handleAccept, handleReject, handleSendMessage, isProcessing } =
    useResponseMutations({
      gigId,
      workspaceId: workspace?.id,
      responses,
    });

  // Handlers — обёрнуты в useCallback для стабилизации ссылок и уменьшения ререндеров таблицы
  const handleAcceptClick = React.useCallback(
    (responseId: string) => {
      const response = responses?.find((r) => r.id === responseId);
      setConfirmDialog({
        open: true,
        responseId,
        action: "accept",
        candidateName: response?.candidateName,
      });
    },
    [responses],
  );

  const handleRejectClick = React.useCallback(
    (responseId: string) => {
      const response = responses?.find((r) => r.id === responseId);
      setConfirmDialog({
        open: true,
        responseId,
        action: "reject",
        candidateName: response?.candidateName,
      });
    },
    [responses],
  );

  const handleMessageClick = React.useCallback(
    (responseId: string) => {
      const response = responses?.find((r) => r.id === responseId);
      setMessageDialog({
        open: true,
        responseId,
        candidateName: response?.candidateName,
      });
    },
    [responses],
  );

  const handleConfirmAction = React.useCallback(async () => {
    try {
      if (confirmDialog.action === "accept") {
        await handleAccept(confirmDialog.responseId);
      } else {
        await handleReject(confirmDialog.responseId);
      }
      setConfirmDialog({ open: false, responseId: "", action: "accept" });
    } catch {
      // Error handling is done in the mutation hook
    }
  }, [
    confirmDialog.action,
    confirmDialog.responseId,
    handleAccept,
    handleReject,
  ]);

  const handleSendMessageClick = React.useCallback(async () => {
    try {
      await handleSendMessage(messageDialog.responseId, messageText);
      setMessageDialog({ open: false, responseId: "" });
      setMessageText("");
    } catch {
      // Error handling is done in the mutation hook
    }
  }, [messageDialog.responseId, messageText, handleSendMessage]);

  if (isLoading || isGigLoading || !workspace?.id) {
    return <ResponsesSkeleton />;
  }

  if (isGigError || !gig) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 sm:py-16 sm:px-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Задание не найдено</CardTitle>
            <CardDescription>
              Задание, для которого вы пытаетесь просмотреть отклики, не
              существует или было удалено
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button asChild className="min-h-11 touch-action-manipulation">
              <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Вернуться к заданиям
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1600px] w-full py-4 px-4 sm:py-6 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-action-manipulation min-h-11 sm:min-h-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданию
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <ResponseHeader gigTitle={gig.title} totalResponses={stats.total} />

        {/* Filters and actions */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <ResponsesFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
              <GigResponseActionButtons
                isSyncing={syncMutation.isPending}
                isAnalyzing={analyzeMutation.isPending}
                onSync={handleSync}
                onAnalyze={handleAnalyze}
                canSync={Boolean(gig.url && gig.externalId)}
                hasResponses={stats.total > 0}
              />
            </div>
            {(searchQuery || statusFilter !== "all") &&
              filteredResponses.length > 0 && (
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
                  Показано {filteredResponses.length} из {stats.total}
                </p>
              )}
          </CardContent>
        </Card>

        {/* Table */}
        {filteredResponses.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(searchQuery) || statusFilter !== "all"}
          />
        ) : (
          <ResponsesTable
            responses={filteredResponses}
            orgSlug={orgSlug}
            workspaceSlug={workspaceSlug}
            gigId={gigId}
            onAccept={handleAcceptClick}
            onReject={handleRejectClick}
            onMessage={handleMessageClick}
            isProcessing={isProcessing}
          />
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        action={confirmDialog.action}
        candidateName={confirmDialog.candidateName}
        onConfirm={handleConfirmAction}
        isProcessing={isProcessing}
      />

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setMessageDialog({ open: false, responseId: "" });
            setMessageText("");
          } else {
            setMessageDialog((prev) => ({ ...prev, open: true }));
          }
        }}
        candidateName={messageDialog.candidateName}
        messageText={messageText}
        onMessageChange={setMessageText}
        onSend={handleSendMessageClick}
        isProcessing={isProcessing}
      />
    </div>
  );
}
