"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken,
} from "~/actions/realtime";
import { useVacancyOperation } from "../context/vacancy-responses-context";
import {
  type ScreeningProgress,
  useScreeningSubscription,
} from "./use-screening-subscription";

export interface ScreeningStateData {
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  progress: ScreeningProgress | null;
  subscriptionActive: boolean;
  subscriptionKey: number;
}

export interface ScreeningState extends ScreeningStateData {
  handleClick: () => Promise<void>;
}

export function useScreeningState(
  vacancyId: string,
  type: "new" | "all",
  onScreen: () => void,
  onComplete: () => void,
) {
  const operation = useVacancyOperation(
    type === "new" ? "screenNew" : "screenAll",
  );
  const [state, setState] = useState<ScreeningStateData>({
    error: null,
    status: "idle",
    message: "",
    progress: null,
    subscriptionActive: false,
    subscriptionKey: 0,
  });

  const isRunningRef = useRef(false);
  const updateProgressRef = useRef(operation.updateProgress);

  // Обновляем ref при изменении функции
  useEffect(() => {
    updateProgressRef.current = operation.updateProgress;
  }, [operation.updateProgress]);

  // Screening subscription
  useScreeningSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    subscriptionKey: `${vacancyId}-${type}-${state.subscriptionKey}`,
    fetchToken:
      type === "new"
        ? fetchScreenNewResponsesToken
        : fetchScreenAllResponsesToken,
    onProgress: useCallback(
      (message: string, progress: ScreeningProgress | null) => {
        updateProgressRef.current(message, progress);
        setState((prev) => ({
          ...prev,
          message,
          progress: progress || null,
        }));
      },
      [],
    ),
    onComplete: useCallback(
      (success: boolean, progress: ScreeningProgress) => {
        setState((prev) => ({
          ...prev,
          progress,
          status: success ? "success" : "error",
          error: success ? null : "Процесс завершился с ошибками",
          message: success
            ? `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`
            : "Процесс завершился с ошибками",
          subscriptionActive: false,
        }));

        isRunningRef.current = false;
        onComplete();
      },
      [onComplete],
    ),
  });

  const handleClick = useCallback(async () => {
    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;

    setState((prev) => ({
      ...prev,
      error: null,
      message: "",
      progress: null,
      status: "loading",
      subscriptionActive: true,
      subscriptionKey: prev.subscriptionKey + 1,
    }));

    try {
      await onScreen();
      // Подписка остается активной - она отключится только когда придет result
    } catch (error: unknown) {
      // При ошибке запуска отключаем подписку сразу
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
        subscriptionActive: false,
      }));
      isRunningRef.current = false;
      onComplete();
    }
  }, [onScreen, onComplete]);

  // Регистрируем обработчик в Context
  useEffect(() => {
    operation.setHandler(handleClick);
  }, [handleClick, operation]);

  return {
    ...state,
    handleClick,
  };
}
