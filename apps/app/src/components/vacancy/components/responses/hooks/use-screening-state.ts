"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken,
} from "~/actions/realtime";
import {
  useVacancyOperation,
  useVacancyResponses,
} from "../context/vacancy-responses-context";
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
  const { registerOnScreenAllProgress, registerOnScreenAllComplete } =
    useVacancyResponses();
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

  // Для type="all" подписка только через RefreshStatusIndicator (один WebSocket).
  // Прогресс и завершение приходят через registerOnScreenAllProgress/Complete.
  useEffect(() => {
    if (type !== "all") return;

    registerOnScreenAllProgress((message, progress) => {
      updateProgressRef.current(message, progress ?? undefined);
      setState((prev) => ({
        ...prev,
        message,
        progress: progress ?? null,
      }));
    });
    registerOnScreenAllComplete(() => {
      isRunningRef.current = false;
      setState((prev) => ({
        ...prev,
        status: "success",
        error: null,
        progress: null,
        message: "Оценка завершена",
        subscriptionActive: false,
      }));
      onComplete();
    });

    return () => {
      registerOnScreenAllProgress(null);
      registerOnScreenAllComplete(null);
    };
  }, [
    type,
    onComplete,
    registerOnScreenAllProgress,
    registerOnScreenAllComplete,
  ]);

  // Screening subscription — только для type="new" (screen-new имеет один источник)
  useScreeningSubscription({
    vacancyId,
    enabled: type === "new" && state.subscriptionActive,
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
        const finalMessage = success
          ? `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`
          : "Процесс завершился с ошибками";

        updateProgressRef.current(finalMessage, progress);

        setState((prev) => ({
          ...prev,
          progress,
          status: success ? "success" : "error",
          error: success ? null : "Процесс завершился с ошибками",
          message: finalMessage,
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
