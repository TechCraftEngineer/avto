/**
 * Типы для синхронизации архивных откликов
 */

import type {
  HrSelectionStatus,
  ResponseStatus,
} from "@qbs-autonaim/db/schema";

/**
 * Типы этапов обработки архивных откликов
 */
export type SyncStage =
  | "initialization"
  | "validation"
  | "import"
  | "parsing"
  | "normalization"
  | "analysis"
  | "status_assignment"
  | "completion";

/**
 * Статус выполнения синхронизации
 */
export type SyncStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Интерфейс прогресса выполнения
 */
export interface SyncProgress {
  stage: SyncStage;
  status: SyncStatus;
  message: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  currentItem?: string;
  processedResponses: number;
  totalResponses: number;
  newResponses: number;
  updatedResponses: number;
  failedResponses: number;
  retriedResponses: number;
  startedAt: Date;
  updatedAt: Date;
}

/**
 * Результат обработки одного отклика
 */
export interface ResponseProcessingResult {
  responseId: string;
  candidateName: string;
  status: "success" | "error" | "retry";
  error?: string;
  screeningResult?: {
    overallScore: number;
    recommendation: string;
  };
}

/**
 * Статистика по синхронизации
 */
export interface SyncStatistics {
  totalResponses: number;
  processedResponses: number;
  newResponses: number;
  updatedResponses: number;
  failedResponses: number;
  retriedResponses: number;
  skippedResponses: number;
  processingTimeMs: number;
  errors: Array<{
    responseId?: string;
    stage: SyncStage;
    message: string;
    timestamp: Date;
  }>;
}

/**
 * Детальный результат синхронизации
 */
export interface SyncResult {
  success: boolean;
  vacancyId: string;
  vacancyTitle: string;
  statistics: SyncStatistics;
  processingResults: ResponseProcessingResult[];
  errors: Array<{
    stage: SyncStage;
    message: string;
    details?: unknown;
  }>;
  duration: number;
}

/**
 * Опции для синхронизации архивных откликов
 */
export interface SyncArchivedResponsesOptions {
  vacancyId: string;
  workspaceId: string;
  onProgress?: (progress: SyncProgress) => void | Promise<void>;
  onStageChange?: (stage: SyncStage, message: string) => void | Promise<void>;
  onResponseProcessed?: (
    result: ResponseProcessingResult,
  ) => void | Promise<void>;
  batchSize?: number;
  retryFailed?: boolean;
  maxRetries?: number;
  analyzeResponses?: boolean;
}

/**
 * Результат нормализации данных отклика
 */
export interface NormalizedResponseData {
  candidateName?: string;
  email?: string;
  phone?: string;
  telegramUsername?: string;
  skills?: string[];
  experience?: unknown;
  profileUrl?: string;
  resumeUrl?: string;
  salaryExpectationsAmount?: number;
}

/**
 * Результат оценки отклика
 */
export interface ResponseEvaluation {
  status: ResponseStatus;
  hrStatus: HrSelectionStatus;
  priority: number;
  recommendation: string;
}
