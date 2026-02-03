export type SyncMode = "refresh" | "archived";
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

export interface RefreshStatusIndicatorProps {
  vacancyId: string;
  className?: string;
  showConfirmation?: boolean;
  onConfirmationClose?: () => void;
  onConfirm?: () => void;
  mode?: SyncMode;
}
