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
  totalResponses?: number; // Общее количество для расчёта процента
  vacancyTitle?: string;
}

export interface AnalyzeProgressData {
  vacancyId: string;
  total: number;
  processed: number;
  failed: number;
}

export interface AnalyzeResponseData {
  vacancyId: string;
  responseId: string;
  success: boolean;
  error?: string;
}

export interface AnalyzeCompletedData {
  vacancyId: string;
  total: number;
  processed: number;
  failed: number;
}

export interface RefreshStatusIndicatorProps {
  vacancyId: string;
  workspaceId: string;
  className?: string;
  showConfirmation?: boolean;
  onConfirmationClose?: () => void;
  onConfirm?: () => void;
  mode?: SyncMode;
  totalResponses?: number;
  message?: string;
  progress?: {
    total: number;
    processed: number;
    failed: number;
  } | null;
}
