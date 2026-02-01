import { useCallback, useRef, useState } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";
import {
  type RefreshProgress,
  useRefreshSubscription,
} from "./use-refresh-subscription";

export interface RefreshStateData {
  dialogOpen: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  progress: RefreshProgress | null;
  subscriptionActive: boolean;
}

export interface RefreshState extends RefreshStateData {
  setDialogOpen: (open: boolean) => void;
  handleRefreshClick: () => Promise<void>;
  handleDialogClose: () => void;
}

export function useRefreshState(
  vacancyId: string,
  onRefresh: () => void,
  onRefreshComplete: () => void,
) {
  const [state, setState] = useState<RefreshStateData>({
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

    setState((prev) => ({
      ...prev,
      dialogOpen: false,
      error: null,
      message: "",
      progress: null,
      status: "idle",
      subscriptionActive: false,
    }));
  }, []);

  useRefreshSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onProgress: useCallback(
      (message: string, progress: RefreshProgress | null) => {
        setState((prev) => ({
          ...prev,
          message,
          progress: progress || null,
        }));
      },
      [],
    ),
    onComplete: useCallback(
      (success: boolean, newCount: number, totalResponses: number) => {
        setState((prev) => ({
          ...prev,
          status: success ? "success" : "error",
          error: success ? null : "Процесс завершился с ошибками",
          message: success
            ? newCount > 0
              ? `Получено новых откликов: ${newCount} из ${totalResponses}`
              : `Новых откликов нет. Всего откликов: ${totalResponses}`
            : "Процесс завершился с ошибками",
        }));

        onRefreshComplete();

        // Очищаем предыдущий таймер перед установкой нового
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          handleDialogClose();
        }, 3000);
      },
      [onRefreshComplete, handleDialogClose],
    ),
  });

  const handleRefreshClick = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      error: null,
      message: "",
      progress: null,
      status: "loading",
      subscriptionActive: true,
    }));

    try {
      await onRefresh();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
      }));
    }
  }, [onRefresh]);

  const setDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, dialogOpen: open }));
  }, []);

  return {
    ...state,
    handleRefreshClick,
    handleDialogClose,
    setDialogOpen,
  };
}
