"use client";

import { createContext, useCallback, useContext, useState } from "react";

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

  // Обработчики операций (устанавливаются компонентами)
  setOperationHandler: (type: OperationType, handler: () => void) => void;
  executeOperation: (type: OperationType) => void;
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

  // Храним обработчики операций
  const [handlers, setHandlers] = useState<
    Partial<Record<OperationType, () => void>>
  >({});

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

  const setOperationHandler = useCallback(
    (type: OperationType, handler: () => void) => {
      setHandlers((prev) => ({ ...prev, [type]: handler }));
    },
    [],
  );

  const executeOperation = useCallback(
    (type: OperationType) => {
      const handler = handlers[type];
      if (handler) {
        handler();
      } else {
        console.warn(`No handler registered for operation: ${type}`);
      }
    },
    [handlers],
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
        setOperationHandler,
        executeOperation,
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

  return {
    vacancyId: context.vacancyId,
    isRunning: context.operations[type].isRunning,
    showConfirmation: context.operations[type].showConfirmation,
    openConfirmation: () => context.showConfirmation(type),
    closeConfirmation: () => context.hideConfirmation(type),
    start: () => context.startOperation(type),
    complete: () => context.completeOperation(type),
    setHandler: (handler: () => void) =>
      context.setOperationHandler(type, handler),
    execute: () => context.executeOperation(type),
  };
}
