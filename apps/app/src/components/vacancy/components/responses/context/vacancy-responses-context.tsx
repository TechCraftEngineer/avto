"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Типы операций с откликами
 */
type OperationType = "refresh" | "archived" | "screenNew" | "screenAll";

/**
 * Состояние операции
 */
interface OperationState {
  isRunning: boolean;
  showConfirmation: boolean;
  message?: string;
  progress?: {
    total: number;
    processed: number;
    failed: number;
  } | null;
}

/**
 * Контекст для управления операциями с откликами вакансии
 */
interface VacancyResponsesContextValue {
  vacancyId: string;

  // Состояния операций
  operations: Record<OperationType, OperationState>;

  // Действия
  showConfirmation: (type: OperationType) => void;
  hideConfirmation: (type: OperationType) => void;
  startOperation: (type: OperationType) => void;
  completeOperation: (type: OperationType) => void;
  updateProgress: (
    type: OperationType,
    message: string,
    progress?: { total: number; processed: number; failed: number } | null,
  ) => void;

  // Обработчики операций (устанавливаются компонентами)
  setOperationHandler: (type: OperationType, handler: () => void) => void;
  executeOperation: (type: OperationType) => void;

  // Колбэк при завершении синхронизации архивных (для handleRefreshComplete)
  registerOnArchivedSyncComplete: (cb: (() => void) | null) => void;
  getOnArchivedSyncComplete: () => (() => void) | null;

  // Колбэки при анализе всех откликов (screen-all)
  registerOnScreenAllProgress: (
    cb:
      | ((
          message: string,
          progress: { total: number; processed: number; failed: number } | null,
        ) => void)
      | null,
  ) => void;
  registerOnScreenAllComplete: (cb: (() => void) | null) => void;
  getOnScreenAllProgress: () =>
    | ((
        message: string,
        progress: { total: number; processed: number; failed: number } | null,
      ) => void)
    | null;
  getOnScreenAllComplete: () => (() => void) | null;
}

const VacancyResponsesContext = createContext<
  VacancyResponsesContextValue | undefined
>(undefined);

/**
 * Provider для управления состоянием операций с откликами
 */
export function VacancyResponsesProvider({
  vacancyId,
  children,
}: {
  vacancyId: string;
  children: React.ReactNode;
}) {
  const [operations, setOperations] = useState<
    Record<OperationType, OperationState>
  >({
    refresh: { isRunning: false, showConfirmation: false },
    archived: { isRunning: false, showConfirmation: false },
    screenNew: { isRunning: false, showConfirmation: false },
    screenAll: { isRunning: false, showConfirmation: false },
  });

  // Храним обработчики операций в ref, чтобы избежать ре-рендеров
  const handlersRef = useRef<Partial<Record<OperationType, () => void>>>({});
  const onArchivedSyncCompleteRef = useRef<(() => void) | null>(null);
  const onScreenAllProgressRef = useRef<
    | ((
        message: string,
        progress: { total: number; processed: number; failed: number } | null,
      ) => void)
    | null
  >(null);
  const onScreenAllCompleteRef = useRef<(() => void) | null>(null);

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
      progress?: { total: number; processed: number; failed: number } | null,
    ) => {
      setOperations((prev) => ({
        ...prev,
        [type]: { ...prev[type], message, progress },
      }));
    },
    [],
  );

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
        | ((
            message: string,
            progress: {
              total: number;
              processed: number;
              failed: number;
            } | null,
          ) => void)
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

  return (
    <VacancyResponsesContext.Provider
      value={{
        vacancyId,
        operations,
        showConfirmation,
        hideConfirmation,
        startOperation,
        completeOperation,
        updateProgress,
        setOperationHandler,
        executeOperation,
        registerOnArchivedSyncComplete,
        getOnArchivedSyncComplete,
        registerOnScreenAllProgress,
        registerOnScreenAllComplete,
        getOnScreenAllProgress,
        getOnScreenAllComplete,
      }}
    >
      {children}
    </VacancyResponsesContext.Provider>
  );
}

/**
 * Hook для использования контекста операций с откликами
 */
export function useVacancyResponses() {
  const context = useContext(VacancyResponsesContext);
  if (!context) {
    throw new Error(
      "useVacancyResponses must be used within VacancyResponsesProvider",
    );
  }
  return context;
}

/**
 * Hook для работы с конкретной операцией
 */
export function useVacancyOperation(type: OperationType) {
  const context = useVacancyResponses();

  // Мемоизируем весь объект, чтобы он был стабильным
  return useMemo(
    () => ({
      vacancyId: context.vacancyId,
      isRunning: context.operations[type].isRunning,
      showConfirmation: context.operations[type].showConfirmation,
      message: context.operations[type].message,
      progress: context.operations[type].progress,
      openConfirmation: () => context.showConfirmation(type),
      closeConfirmation: () => context.hideConfirmation(type),
      start: () => context.startOperation(type),
      complete: () => context.completeOperation(type),
      updateProgress: (
        message: string,
        progress?: { total: number; processed: number; failed: number } | null,
      ) => context.updateProgress(type, message, progress),
      setHandler: (handler: () => void) =>
        context.setOperationHandler(type, handler),
      execute: () => context.executeOperation(type),
    }),
    [context, type],
  );
}
