"use client";

import { Card, cn } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { useVacancyResponses } from "~/components/vacancy/components/responses/context/vacancy-responses-context";
import { useTRPC } from "~/trpc/react";
import { ConfirmationView } from "./confirmation-view";
import { ProgressView } from "./progress-view";
import type { RefreshStatusIndicatorProps } from "./types";
import { useRefreshSubscription } from "./use-refresh-subscription";
import { useRefreshVisibility } from "./use-refresh-visibility";

export function RefreshStatusIndicator({
  vacancyId,
  className,
  showConfirmation: externalShowConfirmation,
  onConfirmationClose,
  onConfirm,
  mode = "refresh",
  totalResponses,
  message: externalMessage,
  progress: externalProgress,
}: RefreshStatusIndicatorProps) {
  const trpc = useTRPC();
  const {
    getOnArchivedSyncComplete,
    getOnScreenAllProgress,
    getOnScreenAllComplete,
  } = useVacancyResponses();

  const { data: initialStatus } = useQuery({
    ...trpc.vacancy.responses.getRefreshStatus.queryOptions({ vacancyId }),
    // Polling с увеличенным интервалом (10 сек) - подписка основной источник
    // Используем только как fallback для случаев когда подписка недоступна
    refetchInterval: (query) => {
      const isRunning = query.state.data?.isRunning ?? false;
      return isRunning ? 10000 : false;
    },
    // Не обновляем при фокусе - подписка сама обновит
    refetchOnWindowFocus: false,
    // Данные считаются свежими на 30 секунд
    staleTime: 30000,
  });

  const visibility = useRefreshVisibility({
    showConfirmationProp: externalShowConfirmation,
    mode,
    initialStatus: initialStatus ?? null,
  });

  const {
    currentProgress,
    currentResult,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    error,
    isConnecting,
    clearAutoCloseTimer,
  } = useRefreshSubscription({
    vacancyId,
    mode,
    onVisibilityChange: visibility.setIsVisible,
    taskStarted: visibility.taskStarted,
    onTaskComplete: () => visibility.setTaskStarted(false),
    onArchivedSyncComplete:
      mode === "archived" ? () => getOnArchivedSyncComplete()?.() : undefined,
    onAnalyzeProgress:
      mode === "analyze"
        ? (msg, prog) => getOnScreenAllProgress()?.(msg, prog)
        : undefined,
    onAnalyzeComplete:
      mode === "analyze" ? () => getOnScreenAllComplete()?.() : undefined,
    initialStatus: initialStatus ?? null,
  });

  const handleStartRefresh = () => {
    visibility.setShowDialog(false);
    visibility.setIsVisible(true);
    visibility.setTaskStarted(true);
    onConfirmationClose?.();
    onConfirm?.();
  };

  const handleClose = () => {
    visibility.setIsVisible(false);
    visibility.setShowDialog(false);
    visibility.setTaskStarted(false);
    clearAutoCloseTimer();
    onConfirmationClose?.();
  };

  const shouldShow = visibility.computeShouldShow({
    currentProgress,
    currentResult,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    externalMessage,
    externalProgress,
    isConnecting,
  });

  if (!shouldShow) return null;

  return (
    <Card
      className={cn(
        "border-none shadow-lg bg-card/95 backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-4 duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4">
        {visibility.showConfirmation ? (
          <ConfirmationView
            mode={mode}
            onClose={handleClose}
            onConfirm={handleStartRefresh}
            totalResponses={totalResponses}
          />
        ) : (
          <ProgressView
            mode={mode}
            currentProgress={currentProgress}
            currentResult={currentResult}
            archivedStatus={archivedStatus}
            analyzeProgress={
              externalProgress
                ? {
                    vacancyId,
                    total: externalProgress.total,
                    processed: externalProgress.processed,
                    failed: externalProgress.failed,
                  }
                : analyzeProgress
            }
            analyzeCompleted={analyzeCompleted}
            error={error}
            isConnecting={isConnecting}
            onClose={handleClose}
            externalMessage={externalMessage}
          />
        )}
      </div>
    </Card>
  );
}

export type { RefreshStatusIndicatorProps, SyncMode } from "./types";
