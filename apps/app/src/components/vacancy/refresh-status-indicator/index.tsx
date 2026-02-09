"use client";

import { cn } from "@qbs-autonaim/ui";
import { Card } from "@qbs-autonaim/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { match, P } from "ts-pattern";
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
  const [showDialog, setShowDialog] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);
  const trpc = useTRPC();

  // Проверяем статус при монтировании
  const { data: initialStatus } = useQuery(
    trpc.vacancy.responses.getRefreshStatus.queryOptions({ vacancyId }),
  );

  // Определяем, есть ли активное задание для текущего режима
  const hasActiveTask = match({ mode, initialStatus })
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "archived",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "vacancy/responses.sync-archived",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "refresh",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "vacancy/responses.refresh",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "screening",
      },
      ({ initialStatus }) => initialStatus.eventType === "response/screen.new",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "analyze",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "response/screen.batch",
    )
    .otherwise(() => false);

  const [isVisible, setIsVisible] = useState(hasActiveTask);

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
    onVisibilityChange: setIsVisible,
    initialStatus: initialStatus ?? null,
  });

  const showConfirmation = externalShowConfirmation ?? showDialog;

  const handleStartRefresh = () => {
    setShowDialog(false);
    setIsVisible(true);
    setTaskStarted(true);
    onConfirmationClose?.();
    onConfirm?.();
  };

  const handleClose = () => {
    setIsVisible(false);
    setShowDialog(false);
    clearAutoCloseTimer();
    onConfirmationClose?.();
  };

  // Определяем, нужно ли показывать компонент
  const hasData = match({
    currentProgress,
    currentResult,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    externalMessage,
    externalProgress,
  })
    .with({ currentProgress: P.not(P.nullish) }, () => true)
    .with({ currentResult: P.not(P.nullish) }, () => true)
    .with({ archivedStatus: P.not(P.nullish) }, () => true)
    .with({ analyzeProgress: P.not(P.nullish) }, () => true)
    .with({ analyzeCompleted: P.not(P.nullish) }, () => true)
    .with({ externalMessage: P.not(P.nullish) }, () => true)
    .with({ externalProgress: P.not(P.nullish) }, () => true)
    .otherwise(() => false);

  const shouldShow =
    showConfirmation ||
    (isVisible && (hasActiveTask || hasData || isConnecting || taskStarted));

  if (!shouldShow) {
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
        {showConfirmation ? (
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
