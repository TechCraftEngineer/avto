import { useCallback, useRef, useState } from "react";
import {
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken
} from "~/actions/realtime";
import {
  type ScreeningProgress,
  useScreeningSubscription,
} from "./use-screening-subscription";

export interface ScreeningState {
  dialogOpen: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  progress: ScreeningProgress | null;
  subscriptionActive: boolean;
}

export function useScreeningState(
  vacancyId: string,
  type: "new" | "all",
  onScreen: () => void,
  onScreeningDialogClose: () => void,
) {
  const [state, setState] = useState<ScreeningState>({
    dialogOpen: false,
    error: null,
    status: "idle",
    message: "",
    progress: null,
    subscriptionActive: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDialogClose = useCallback(() => {
    // Очищаем таймер при закрытии диалога
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      dialogOpen: false,
      error: null,
      message: "",
      progress: null,
      status: "idle",
      subscriptionActive: false,
    }));
    onScreeningDialogClose();
  }, [onScreeningDialogClose]);

  // Screening subscription
  useScreeningSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken: type === "new" ? fetchScreenNewResponsesToken : fetchScreenAllResponsesToken,
    onProgress: useCallback((message, progress) => {
      setState(prev => ({
        ...prev,
        message,
        progress: progress || null
      }));
    }, []),
    onComplete: useCallback((success, progress) => {
      setState(prev => ({
        ...prev,
        progress,
        status: success ? "success" : "error",
        error: success ? null : "Процесс завершился с ошибками",
        message: success
          ? `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`
          : "Процесс завершился с ошибками",
      }));

      // Очищаем предыдущий таймер перед установкой нового
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        handleDialogClose();
      }, 3000);
    }, [handleDialogClose]),
  });

  const handleClick = useCallback(async () => {
    setState(prev => ({
      ...prev,
      error: null,
      message: "",
      progress: null,
      status: "loading",
      subscriptionActive: true,
    }));

    try {
      await onScreen();
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
      }));
    }
  }, [onScreen]);

  const setDialogOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, dialogOpen: open }));
  }, []);

  return {
    ...state,
    handleClick,
    handleDialogClose,
    setDialogOpen,
  };
}