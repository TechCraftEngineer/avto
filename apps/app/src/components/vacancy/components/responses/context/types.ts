/** Типы операций с откликами */
export type OperationType = "refresh" | "archived" | "screenNew" | "screenAll";

/** Прогресс массовой операции */
export interface OperationProgress {
  total: number;
  processed: number;
  failed: number;
}

/** Состояние одной операции */
export interface OperationState {
  isRunning: boolean;
  showConfirmation: boolean;
  message?: string;
  progress?: OperationProgress | null;
}

/** Тип для колбэка прогресса screen-all */
export type OnScreenAllProgress = (
  message: string,
  progress: OperationProgress | null,
) => void;
