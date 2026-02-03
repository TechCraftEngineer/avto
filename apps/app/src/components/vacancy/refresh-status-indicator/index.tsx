"use client";

import { cn } from "@qbs-autonaim/ui";
import { Card } from "@qbs-autonaim/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
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
}: RefreshStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [internalShowConfirmation, setInternalShowConfirmation] =
    useState(false);

  const trpc = useTRPC();
  const showConfirmation = externalShowConfirmation ?? internalShowConfirmation;

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const {
    currentProgress,
    currentResult,
    archivedStatus,
    error,
    clearAutoCloseTimer,
  } = useRefreshSubscription({
    vacancyId,
    mode,
    onVisibilityChange: handleVisibilityChange,
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

  // Проверяем статус при монтировании (только для режима refresh)
  const { data: initialStatus } = useQuery(
    trpc.vacancy.responses.getRefreshStatus.queryOptions({ vacancyId }),
  );

  // Устанавливаем начальный статус если задание уже запущено
  useEffect(() => {
    if (
      mode === "refresh" &&
      initialStatus?.isRunning &&
      initialStatus.status &&
      initialStatus.message
    ) {
      setIsVisible(true);
      setInternalShowConfirmation(false);
    }
  }, [initialStatus, mode]);

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
          />
        ) : (
          <ProgressView
            mode={mode}
            currentProgress={currentProgress}
            currentResult={currentResult}
            archivedStatus={archivedStatus}
            error={error}
            onClose={handleClose}
          />
        )}
      </div>
    </Card>
  );
}

export type { RefreshStatusIndicatorProps, SyncMode } from "./types";
