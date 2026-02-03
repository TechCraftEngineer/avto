import { Loader2, XCircle } from "lucide-react";
import { ArchivedStatusContent } from "./archived-status-content";
import { RefreshProgressContent } from "./refresh-progress-content";
import { RefreshResultContent } from "./refresh-result-content";
import { StatusIcon } from "./status-icon";
import type {
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
  error: Error | null;
  onClose: () => void;
}

export function ProgressView({
  mode,
  currentProgress,
  currentResult,
  archivedStatus,
  error,
  onClose,
}: ProgressViewProps) {
  const isArchivedMode = mode === "archived";
  const currentStatus = isArchivedMode
    ? archivedStatus?.status
    : currentProgress?.status || (currentResult ? "completed" : undefined);
  const isCompleted = isArchivedMode
    ? archivedStatus?.status === "completed"
    : currentResult?.success === true;

  return (
    <div className="flex items-start gap-3">
      <StatusIcon status={currentStatus} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold">
            {isArchivedMode ? (
              <>
                {!archivedStatus && "Подключение…"}
                {archivedStatus?.status === "started" && "Задание в очереди"}
                {archivedStatus?.status === "processing" &&
                  "Синхронизация архивных откликов"}
                {archivedStatus?.status === "error" && "Ошибка синхронизации"}
                {archivedStatus?.status === "completed" &&
                  "Синхронизация завершена"}
              </>
            ) : (
              <>
                {!currentProgress && !currentResult && "Подключение…"}
                {currentProgress?.status === "started" && "Задание в очереди"}
                {currentProgress?.status === "processing" &&
                  "Получение откликов"}
                {currentProgress?.status === "error" && "Ошибка обновления"}
                {isCompleted && "Получение завершено"}
              </>
            )}
          </h4>
          {!isArchivedMode && currentProgress?.currentPage !== undefined && (
            <span className="text-xs text-muted-foreground shrink-0">
              Страница&nbsp;{currentProgress.currentPage + 1}
            </span>
          )}
        </div>

        {!currentProgress && !currentResult && !archivedStatus && !error && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Подключение к серверу…</span>
          </div>
        )}

        {isArchivedMode && archivedStatus && (
          <ArchivedStatusContent status={archivedStatus} />
        )}

        {!isArchivedMode && currentProgress && (
          <RefreshProgressContent progress={currentProgress} />
        )}

        {!isArchivedMode && currentResult && (
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
