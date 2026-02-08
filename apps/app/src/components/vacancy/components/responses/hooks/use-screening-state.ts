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
  });

  const isRunningRef = useRef(false);

  // Screening subscription
  useScreeningSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken:
      type === "new"
        ? fetchScreenNewResponsesToken
        : fetchScreenAllResponsesToken,
    onProgress: useCallback(
      (message: string, progress: ScreeningProgress | null) => {
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
    }));

    try {
      await onScreen();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
        subscriptionActive: false,
      }));
      onComplete();
    } finally {
      isRunningRef.current = false;
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
