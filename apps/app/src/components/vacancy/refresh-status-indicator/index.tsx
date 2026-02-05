"use client";

import { cn } from "@qbs-autonaim/ui";
import { Card } from "@qbs-autonaim/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
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
  batchId,
  totalResponses,
}: RefreshStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [internalShowConfirmation, setInternalShowConfirmation] =
    useState(false);

  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  const showConfirmation = externalShowConfirmation ?? internalShowConfirmation;

  // Проверяем статус при монтировании для всех режимов
  const { data: initialStatus } = useQuery(
    trpc.vacancy.responses.getRefreshStatus.queryOptions({ vacancyId }),
  );

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
    batchId,
    workspaceId: workspace?.id,
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

  if (!isVisible && !showConfirmation) {
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
            analyzeProgress={analyzeProgress}
            analyzeCompleted={analyzeCompleted}
            error={error}
            isConnecting={isConnecting}
            onClose={handleClose}
          />
        )}
      </div>
    </Card>
  );
}

export type { RefreshStatusIndicatorProps, SyncMode } from "./types";
