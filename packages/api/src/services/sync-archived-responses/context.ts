/**
 * Контекст выполнения синхронизации архивных откликов
 */

import type {
  ResponseProcessingResult,
  SyncArchivedResponsesOptions,
  SyncProgress,
  SyncResult,
  SyncStage,
  SyncStatistics,
} from "./types";

/**
 * Контекст выполнения синхронизации
 * Управляет состоянием, прогрессом и результатами синхронизации
 */
export class SyncExecutionContext {
  private progress: SyncProgress;
  private statistics: SyncStatistics;
  private processingResults: ResponseProcessingResult[];
  private errors: SyncResult["errors"];
  private startTime: number;
  private cancelled: boolean = false;
  private options: SyncArchivedResponsesOptions;

  constructor(options: SyncArchivedResponsesOptions) {
    this.options = options;
    this.startTime = Date.now();
    this.progress = {
      stage: "initialization",
      status: "pending",
      message: "Инициализация...",
      currentStep: 0,
      totalSteps: 0,
      percentage: 0,
      processedResponses: 0,
      totalResponses: 0,
      newResponses: 0,
      updatedResponses: 0,
      failedResponses: 0,
      retriedResponses: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    };
    this.statistics = {
      totalResponses: 0,
      processedResponses: 0,
      newResponses: 0,
      updatedResponses: 0,
      failedResponses: 0,
      retriedResponses: 0,
      skippedResponses: 0,
      processingTimeMs: 0,
      errors: [],
    };
    this.processingResults = [];
    this.errors = [];
  }

  async updateProgress(updates: Partial<SyncProgress>): Promise<void> {
    this.progress = { ...this.progress, ...updates, updatedAt: new Date() };
    await this.options.onProgress?.(this.progress);
  }

  async changeStage(stage: SyncStage, message: string): Promise<void> {
    console.log(`[SyncArchived] Этап: ${stage} - ${message}`);
    await this.updateProgress({
      stage,
      status: "running",
      message,
      currentStep: this.progress.currentStep + 1,
    });
    await this.options.onStageChange?.(stage, message);
  }

  addError(stage: SyncStage, message: string, details?: unknown): void {
    const error = { stage, message, details };
    this.errors.push(error);
    this.statistics.errors.push({
      stage,
      message,
      timestamp: new Date(),
    });
    console.error(
      `[SyncArchived] Ошибка на этапе ${stage}: ${message}`,
      details,
    );
  }

  addProcessingResult(result: ResponseProcessingResult): void {
    this.processingResults.push(result);
    if (result.status === "success") {
      this.statistics.processedResponses++;
      this.progress.processedResponses++;
    } else if (result.status === "error") {
      this.statistics.failedResponses++;
      this.progress.failedResponses++;
    } else if (result.status === "retry") {
      this.statistics.retriedResponses++;
      this.progress.retriedResponses++;
    }
  }

  getProgress(): SyncProgress {
    return { ...this.progress };
  }

  getStatistics(): SyncStatistics {
    return {
      ...this.statistics,
      processingTimeMs: Date.now() - this.startTime,
    };
  }

  updateTotalResponses(total: number): void {
    this.statistics.totalResponses = total;
  }

  incrementRetriedResponses(): void {
    this.statistics.retriedResponses++;
  }

  getLastProcessingResult(): ResponseProcessingResult | undefined {
    return this.processingResults[this.processingResults.length - 1];
  }

  getResults(): ResponseProcessingResult[] {
    return [...this.processingResults];
  }

  getErrors(): SyncResult["errors"] {
    return [...this.errors];
  }

  cancel(): void {
    this.cancelled = true;
    this.progress.status = "cancelled";
    console.log("[SyncArchived] Синхронизация отменена");
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  async finalize(success: boolean): Promise<void> {
    this.progress.status = success ? "completed" : "failed";
    this.progress.message = success
      ? "Синхронизация завершена"
      : "Синхронизация завершена с ошибками";
    this.statistics.processingTimeMs = Date.now() - this.startTime;
    await this.updateProgress({ percentage: 100 });
  }
}
