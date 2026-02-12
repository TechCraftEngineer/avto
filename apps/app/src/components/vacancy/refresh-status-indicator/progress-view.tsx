import { Loader2, XCircle } from "lucide-react";
import { AnalyzeProgressContent } from "./analyze-progress-content";
import { ArchivedStatusContent } from "./archived-status-content";
import { getProgressStatus, getProgressTitle } from "./progress-view-utils";
import { RefreshProgressContent } from "./refresh-progress-content";
import { RefreshResultContent } from "./refresh-result-content";
import { StatusIcon } from "./status-icon";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ResultData,
  SyncMode,
} from "./types";

interface ProgressViewProps {
  mode: SyncMode;
  currentProgress: ProgressData | null;
  currentResult: ResultData | null;
  archivedStatus: ArchivedStatusData | null;
  analyzeProgress: AnalyzeProgressData | null;
  analyzeCompleted: AnalyzeCompletedData | null;
  error: Error | null;
  isConnecting: boolean;
  onClose: () => void;
  externalMessage?: string;
}

export function ProgressView({
  mode,
  currentProgress,
  currentResult,
  archivedStatus,
  analyzeProgress,
  analyzeCompleted,
  error,
  isConnecting,
  onClose,
  externalMessage,
}: ProgressViewProps) {
  const currentStatus = getProgressStatus({
    mode,
    archivedStatus,
    analyzeCompleted,
    analyzeProgress,
    currentProgress,
    currentResult,
    externalMessage,
  });

  const title = getProgressTitle({
    mode,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    currentProgress,
    currentResult,
  });

  const showPageNumber =
    mode === "refresh" && currentProgress?.currentPage !== undefined;
  const showConnecting =
    !currentProgress &&
    !currentResult &&
    !archivedStatus &&
    !analyzeProgress &&
    !analyzeCompleted &&
    !error &&
    mode !== "analyze" &&
    mode !== "screening" &&
    isConnecting;

  return (
    <div className="flex items-start gap-3">
      <StatusIcon status={currentStatus} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          {showPageNumber && (
            <span className="text-xs text-muted-foreground shrink-0">
              Страница&nbsp;{(currentProgress?.currentPage ?? 0) + 1}
            </span>
          )}
        </div>

        {showConnecting && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Инициализация…</span>
          </div>
        )}

        {mode === "archived" && archivedStatus && (
          <ArchivedStatusContent status={archivedStatus} />
        )}

        {(mode === "analyze" || mode === "screening") && (
          <>
            {externalMessage && (
              <p className="text-xs text-muted-foreground mb-2">
                {externalMessage}
              </p>
            )}
            <AnalyzeProgressContent
              progress={analyzeProgress}
              completed={analyzeCompleted}
            />
          </>
        )}

        {mode === "refresh" && currentProgress && (
          <RefreshProgressContent progress={currentProgress} />
        )}

        {mode === "refresh" && currentResult && (
          <RefreshResultContent result={currentResult} />
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive rounded-lg border border-destructive/50 bg-destructive/10 p-2 mt-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs">Ошибка подключения к серверу</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 hover:bg-muted rounded-md transition-colors shrink-0 touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
        aria-label="Закрыть уведомление"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
