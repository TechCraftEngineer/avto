import { Loader2, XCircle } from "lucide-react";
import { match, P } from "ts-pattern";
import { AnalyzeProgressContent } from "./analyze-progress-content";
import { ArchivedStatusContent } from "./archived-status-content";
import { RefreshProgressContent } from "./refresh-progress-content";
import { RefreshResultContent } from "./refresh-result-content";
import { StatusIcon } from "./status-icon";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ProgressStatus,
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
}: ProgressViewProps) {
  // Определяем текущий статус через pattern matching
  const currentStatus: ProgressStatus | undefined = match({
    mode,
    archivedStatus,
    analyzeCompleted,
    analyzeProgress,
    currentProgress,
    currentResult,
  })
    .with(
      { mode: "archived", archivedStatus: { status: P.select() } },
      (status: string) => status as ProgressStatus,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        analyzeCompleted: P.not(P.nullish),
      },
      () => "completed" as const,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        analyzeProgress: P.not(P.nullish),
      },
      () => "processing" as const,
    )
    .with(
      { currentProgress: { status: P.select() } },
      (status: string) => status as ProgressStatus,
    )
    .with({ currentResult: P.not(P.nullish) }, () => "completed" as const)
    .otherwise(() => undefined);

  // Определяем заголовок через pattern matching
  const title = match({
    mode,
    archivedStatus,
    analyzeProgress,
    analyzeCompleted,
    currentProgress,
    currentResult,
  })
    .with({ mode: "archived", archivedStatus: P.nullish }, () => "Подключение…")
    .with(
      { mode: "archived", archivedStatus: { status: "started" } },
      () => "Задание в очереди",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "processing" } },
      () => "Синхронизация архивных откликов",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "error" } },
      () => "Ошибка синхронизации",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "completed" } },
      () => "Синхронизация завершена",
    )
    .with(
      { mode: "screening", analyzeCompleted: P.not(P.nullish) },
      () => "Скрининг завершен",
    )
    .with(
      { mode: "screening", analyzeProgress: P.not(P.nullish) },
      () => "Скрининг откликов",
    )
    .with({ mode: "screening" }, () => "Запуск скрининга…")
    .with(
      { mode: "analyze", analyzeCompleted: P.not(P.nullish) },
      () => "Анализ завершен",
    )
    .with(
      { mode: "analyze", analyzeProgress: P.not(P.nullish) },
      () => "Анализ откликов",
    )
    .with({ mode: "analyze" }, () => "Запуск анализа…")
    .with(
      { currentProgress: P.nullish, currentResult: P.nullish },
      () => "Подключение…",
    )
    .with({ currentProgress: { status: "started" } }, () => "Задание в очереди")
    .with(
      { currentProgress: { status: "processing" } },
      () => "Получение откликов",
    )
    .with({ currentProgress: { status: "error" } }, () => "Ошибка обновления")
    .with({ currentResult: P.not(P.nullish) }, () => "Получение завершено")
    .otherwise(() => "Подключение…");

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
            <span>Подключение к серверу…</span>
          </div>
        )}

        {mode === "archived" && archivedStatus && (
          <ArchivedStatusContent status={archivedStatus} />
        )}

        {(mode === "analyze" || mode === "screening") && (
          <AnalyzeProgressContent
            progress={analyzeProgress}
            completed={analyzeCompleted}
          />
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
