import { useCallback, useRef, useState } from "react";
import { fetchRefreshAllResumesToken } from "~/actions/realtime";
import {
  type RefreshAllResumesProgress,
  useRefreshAllResumesSubscription,
} from "./use-refresh-all-resumes-subscription";

export interface RefreshAllResumesStateData {
  dialogOpen: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  progress: RefreshAllResumesProgress | null;
  subscriptionActive: boolean;
}

export interface RefreshAllResumesState extends RefreshAllResumesStateData {
  setDialogOpen: (open: boolean) => void;
  handleClick: () => Promise<void>;
  handleDialogClose: () => void;
}

export function useRefreshAllResumesState(
  vacancyId: string,
  onRefreshAllResumes: () => void,
  onRefreshAllResumesDialogClose: () => void,
) {
  const [state, setState] = useState<RefreshAllResumesStateData>({
    dialogOpen: false,
    error: null,
    status: "idle",
    message: "",
    progress: null,
    subscriptionActive: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDialogClose = useCallback(() => {
    if (state.status === "loading") {
      return;
    }

    // Очищаем таймер при закрытии диалога
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      dialogOpen: false,
      error: null,
      message: "",
      progress: null,
      status: "idle",
      subscriptionActive: false,
    }));
    onRefreshAllResumesDialogClose();
  }, [state.status, onRefreshAllResumesDialogClose]);

  // Refresh all resumes subscription callbacks
  const handleProgress = useCallback(
    (message: string, progress: RefreshAllResumesProgress | null) => {
      setState((prev) => ({
        ...prev,
        message,
        progress: progress || null,
      }));
    },
    [],
  );

  const handleComplete = useCallback(
    (success: boolean, progress: RefreshAllResumesProgress) => {
      setState((prev) => ({
        ...prev,
        progress,
        status: success ? "success" : "error",
        error: success ? null : "Процесс завершился с ошибками",
        message: success
          ? `Обновление резюме завершено! Обработано: ${progress.processed} из ${progress.total}`
          : "Процесс завершился с ошибками",
      }));

      // Очищаем предыдущий таймер перед установкой нового
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        handleDialogClose();
      }, 3000);
    },
    [handleDialogClose],
  );

  // Refresh all resumes subscription
  useRefreshAllResumesSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken: fetchRefreshAllResumesToken,
    onProgress: handleProgress,
    onComplete: handleComplete,
  });

  const handleClick = useCallback(async () => {
    if (state.status === "loading") return;

    setState((prev) => ({
      ...prev,
      error: null,
      message: "",
      progress: null,
      status: "loading",
      subscriptionActive: true,
    }));

    try {
      await onRefreshAllResumes();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
      }));
    }
  }, [state.status, onRefreshAllResumes]);

  const setDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, dialogOpen: open }));
  }, []);

  return {
    ...state,
    handleClick,
    handleDialogClose,
    setDialogOpen,
  };
}
