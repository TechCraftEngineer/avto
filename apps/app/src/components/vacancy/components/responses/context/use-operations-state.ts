"use client";

import { useCallback, useRef, useState } from "react";
import type { OperationProgress, OperationState, OperationType } from "./types";

const INITIAL_OPERATIONS: Record<OperationType, OperationState> = {
  refresh: { isRunning: false, showConfirmation: false },
  archived: { isRunning: false, showConfirmation: false },
  screenNew: { isRunning: false, showConfirmation: false },
  screenAll: { isRunning: false, showConfirmation: false },
};

export function useOperationsState() {
  const [operations, setOperations] =
    useState<Record<OperationType, OperationState>>(INITIAL_OPERATIONS);

  const showConfirmation = useCallback((type: OperationType) => {
    setOperations((prev) => ({
      ...prev,
      [type]: { ...prev[type], showConfirmation: true },
    }));
  }, []);

  const hideConfirmation = useCallback((type: OperationType) => {
    setOperations((prev) => ({
      ...prev,
      [type]: { ...prev[type], showConfirmation: false },
    }));
  }, []);

  const startOperation = useCallback((type: OperationType) => {
    setOperations((prev) => ({
      ...prev,
      [type]: { isRunning: true, showConfirmation: false },
    }));
  }, []);

  const completeOperation = useCallback((type: OperationType) => {
    setOperations((prev) => ({
      ...prev,
      [type]: { ...prev[type], isRunning: false },
    }));
  }, []);

  const updateProgress = useCallback(
    (
      type: OperationType,
      message: string,
      progress?: OperationProgress | null,
    ) => {
      setOperations((prev) => ({
        ...prev,
        [type]: { ...prev[type], message, progress },
      }));
    },
    [],
  );

  return {
    operations,
    showConfirmation,
    hideConfirmation,
    startOperation,
    completeOperation,
    updateProgress,
  };
}

export function useOperationHandlers() {
  const handlersRef = useRef<Partial<Record<OperationType, () => void>>>({});
  const onArchivedSyncCompleteRef = useRef<(() => void) | null>(null);
  const onScreenAllProgressRef = useRef<
    ((message: string, progress: OperationProgress | null) => void) | null
  >(null);
  const onScreenAllCompleteRef = useRef<(() => void) | null>(null);

  const setOperationHandler = useCallback(
    (type: OperationType, handler: () => void) => {
      handlersRef.current[type] = handler;
    },
    [],
  );

  const executeOperation = useCallback((type: OperationType) => {
    const handler = handlersRef.current[type];
    if (handler) {
      handler();
    } else {
      console.warn(`No handler registered for operation: ${type}`);
    }
  }, []);

  const registerOnArchivedSyncComplete = useCallback(
    (cb: (() => void) | null) => {
      onArchivedSyncCompleteRef.current = cb;
    },
    [],
  );

  const getOnArchivedSyncComplete = useCallback(
    () => onArchivedSyncCompleteRef.current,
    [],
  );

  const registerOnScreenAllProgress = useCallback(
    (
      cb:
        | ((message: string, progress: OperationProgress | null) => void)
        | null,
    ) => {
      onScreenAllProgressRef.current = cb;
    },
    [],
  );

  const registerOnScreenAllComplete = useCallback((cb: (() => void) | null) => {
    onScreenAllCompleteRef.current = cb;
  }, []);

  const getOnScreenAllProgress = useCallback(
    () => onScreenAllProgressRef.current,
    [],
  );

  const getOnScreenAllComplete = useCallback(
    () => onScreenAllCompleteRef.current,
    [],
  );

  return {
    setOperationHandler,
    executeOperation,
    registerOnArchivedSyncComplete,
    getOnArchivedSyncComplete,
    registerOnScreenAllProgress,
    registerOnScreenAllComplete,
    getOnScreenAllProgress,
    getOnScreenAllComplete,
  };
}
