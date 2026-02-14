import { useState } from "react";
import { match, P } from "ts-pattern";
import { checkActiveTask } from "./mode-utils";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ResultData,
  SyncMode,
} from "./types";

export function hasData(params: {
  currentProgress: ProgressData | null;
  currentResult: ResultData | null;
  archivedStatus: ArchivedStatusData | null;
  analyzeProgress: AnalyzeProgressData | null;
  analyzeCompleted: AnalyzeCompletedData | null;
  externalMessage?: string;
  externalProgress?: {
    total: number;
    processed: number;
    failed: number;
  } | null;
}): boolean {
  return match(params)
    .with({ currentProgress: P.not(P.nullish) }, () => true)
    .with({ currentResult: P.not(P.nullish) }, () => true)
    .with({ archivedStatus: P.not(P.nullish) }, () => true)
    .with({ analyzeProgress: P.not(P.nullish) }, () => true)
    .with({ analyzeCompleted: P.not(P.nullish) }, () => true)
    .with({ externalMessage: P.not(P.nullish) }, () => true)
    .with({ externalProgress: P.not(P.nullish) }, () => true)
    .otherwise(() => false);
}

export function useRefreshVisibility(params: {
  showConfirmationProp?: boolean;
  mode: SyncMode;
  initialStatus: { isRunning: boolean; eventType: string | null } | null;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);
  const [isVisible, setIsVisible] = useState(() =>
    checkActiveTask(params.mode, params.initialStatus),
  );

  const hasActiveTask =
    checkActiveTask(params.mode, params.initialStatus) || taskStarted;

  const showConfirmation = params.showConfirmationProp ?? showDialog;

  function computeShouldShow(params: {
    currentProgress: ProgressData | null;
    currentResult: ResultData | null;
    archivedStatus: ArchivedStatusData | null;
    analyzeProgress: AnalyzeProgressData | null;
    analyzeCompleted: AnalyzeCompletedData | null;
    externalMessage?: string;
    externalProgress?: {
      total: number;
      processed: number;
      failed: number;
    } | null;
    isConnecting: boolean;
  }): boolean {
    return (
      showConfirmation ||
      (isVisible &&
        (hasActiveTask ||
          hasData(params) ||
          params.isConnecting ||
          taskStarted))
    );
  }

  return {
    showConfirmation,
    setShowDialog,
    isVisible,
    setIsVisible,
    taskStarted,
    setTaskStarted,
    computeShouldShow,
  };
}
