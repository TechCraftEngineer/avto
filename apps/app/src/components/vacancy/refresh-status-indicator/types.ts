export type SyncMode = "refresh" | "archived" | "analyze" | "screening";
export type ProgressStatus = "started" | "processing" | "completed" | "error";

export interface ProgressData {
  vacancyId: string;
  status: ProgressStatus;
  message: string;
  currentPage?: number;
  totalSaved?: number;
  totalSkipped?: number;
}

export interface ResultData {
  vacancyId: string;
  success: boolean;
  newCount: number;
  totalResponses: number;
  error?: string;
}

export interface ArchivedStatusData {
  status: ProgressStatus;
  message: string;
  vacancyId: string;
  syncedResponses?: number;
  newResponses?: number;
  vacancyTitle?: string;
}

export interface AnalyzeProgressData {
  batchId: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

export interface AnalyzeResponseData {
  batchId: string;
  responseId: string;
  success: boolean;
  error?: string;
}

export interface AnalyzeCompletedData {
  batchId: string;
  total: number;
  successful: number;
  failed: number;
}

export interface RefreshStatusIndicatorProps {
  vacancyId: string;
  className?: string;
  showConfirmation?: boolean;
  onConfirmationClose?: () => void;
  onConfirm?: () => void;
  mode?: SyncMode;
  batchId?: string;
  totalResponses?: number;
  message?: string;
  progress?: {
    total: number;
    processed: number;
    failed: number;
  } | null;
}
