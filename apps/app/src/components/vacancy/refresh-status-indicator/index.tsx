"use client";

import { cn } from "@qbs-autonaim/ui";
import { Card } from "@qbs-autonaim/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ConfirmationView } from "./confirmation-view";
import { ProgressView } from "./progress-view";
import type { RefreshStatusIndicatorProps } from "./types";
import { useRefreshSubscription } from "./use-refresh-subscription";

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
  const [isVisible, setIsVisible] = useState(false);
  const [internalShowConfirmation, setInternalShowConfirmation] =
    useState(false);

  const trpc = useTRPC();
  const showConfirmation = externalShowConfirmation ?? internalShowConfirmation;

  const isArchivedMode = mode === "archived";
  const isAnalyzeMode = mode === "analyze";
  const isScreeningMode = mode === "screening";

  // Проверяем статус при монтировании для всех режимов
  const { data: initialStatus } = useQuery(
    trpc.vacancy.responses.getRefreshStatus.queryOptions({ vacancyId }),
  );

  // Определяем, есть ли активное задание для текущего режима
  const hasActiveTaskForMode =
    initialStatus?.isRunning === true &&
    ((isArchivedMode &&
      initialStatus.eventType === "vacancy/responses.sync-archived") ||
      (mode === "refresh" &&
        initialStatus.eventType === "vacancy/responses.refresh") ||
      (isScreeningMode && initialStatus.eventType === "response/screen.new") ||
      (isAnalyzeMode && initialStatus.eventType === "response/screen.batch"));

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

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
    onVisibilityChange: handleVisibilityChange,
    initialStatus: initialStatus ?? null,
  });

  const handleStartRefresh = () => {
    setInternalShowConfirmation(false);
    setIsVisible(true);
    onConfirmationClose?.();
    onConfirm?.();
  };

  const handleClose = () => {
    setIsVisible(false);
    setInternalShowConfirmation(false);
    clearAutoCloseTimer();
    onConfirmationClose?.();
  };

  // Не рендерим компонент если:
  // 1. Нет активного задания для этого режима
  // 2. И не показывается диалог подтверждения
  // 3. И компонент не видим
  // 4. И нет внешнего прогресса (для screening/analyze)
  const hasExternalProgress =
    (isScreeningMode || isAnalyzeMode) && (externalMessage || externalProgress);
  if (
    !hasActiveTaskForMode &&
    !showConfirmation &&
    !isVisible &&
    !hasExternalProgress
  ) {
    return null;
  }

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
        {showConfirmation && !isVisible ? (
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
                    batchId: vacancyId,
                    total: externalProgress.total,
                    processed: externalProgress.processed,
                    successful:
                      externalProgress.processed - externalProgress.failed,
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
