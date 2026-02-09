import type {
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
} from "./types";

interface InitialStatusProgress {
  currentPage?: number;
  totalSaved?: number;
  totalSkipped?: number;
  total?: number;
  processed?: number;
  failed?: number;
  newCount?: number;
}

export interface InitialStatus {
  isRunning: boolean;
  status: string | null;
  message: string;
  eventType: string | null;
  progress?: InitialStatusProgress | null;
  runId?: string | null;
  startedAt?: string | null;
}

interface StatusHandlers {
  setArchivedStatus: (status: ArchivedStatusData) => void;
  setCurrentProgress: (progress: ProgressData) => void;
  setAnalyzeProgress: (progress: AnalyzeProgressData) => void;
}

export function restoreProgressFromInitialStatus(
  initialStatus: InitialStatus,
  vacancyId: string,
  handlers: StatusHandlers,
) {
  if (initialStatus.progress) {
    const { eventType, progress } = initialStatus;

    if (eventType === "vacancy/responses.sync-archived") {
      handlers.setArchivedStatus({
        status: "processing",
        message: initialStatus.message,
        vacancyId,
        syncedResponses: progress.totalSaved,
        newResponses: progress.newCount,
      });
    } else if (
      eventType === "vacancy/responses.refresh" ||
      eventType === "response/screen.new"
    ) {
      handlers.setCurrentProgress({
        status: "processing",
        message: initialStatus.message,
        vacancyId,
        currentPage: progress.currentPage,
        totalSaved: progress.totalSaved,
        totalSkipped: progress.totalSkipped,
      });
    } else if (
      eventType === "response/screen.batch" &&
      progress.total !== undefined &&
      progress.processed !== undefined
    ) {
      handlers.setAnalyzeProgress({
        vacancyId,
        total: progress.total,
        processed: progress.processed,
        failed: progress.failed || 0,
      });
    }
  } else {
    // Нет деталей прогресса, показываем базовое сообщение
    const { eventType } = initialStatus;

    if (eventType === "vacancy/responses.sync-archived") {
      handlers.setArchivedStatus({
        status: "processing",
        message: initialStatus.message,
        vacancyId,
      });
    } else if (
      eventType === "vacancy/responses.refresh" ||
      eventType === "response/screen.new"
    ) {
      handlers.setCurrentProgress({
        status: "processing",
        message: initialStatus.message,
        vacancyId,
      });
    }
  }
}
