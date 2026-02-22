"use client";

import { createContext, useContext, useMemo } from "react";
import type { OperationType } from "./types";
import {
  useOperationHandlers,
  useOperationsState,
} from "./use-operations-state";

/** Контекст для управления операциями с откликами вакансии */
interface VacancyResponsesContextValue {
  vacancyId: string;
  operations: ReturnType<typeof useOperationsState>["operations"];
  showConfirmation: (type: OperationType) => void;
  hideConfirmation: (type: OperationType) => void;
  startOperation: (type: OperationType) => void;
  completeOperation: (type: OperationType) => void;
  updateProgress: (
    type: OperationType,
    message: string,
    progress?: { total: number; processed: number; failed: number } | null,
  ) => void;
  setOperationHandler: (type: OperationType, handler: () => void) => void;
  executeOperation: (type: OperationType) => void;
  registerOnArchivedSyncComplete: (cb: (() => void) | null) => void;
  getOnArchivedSyncComplete: () => (() => void) | null;
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

export function VacancyResponsesProvider({
  vacancyId,
  children,
}: {
  vacancyId: string;
  children: React.ReactNode;
}) {
  const state = useOperationsState();
  const handlers = useOperationHandlers();

  const value = useMemo<VacancyResponsesContextValue>(
    () => ({
      vacancyId,
      ...state,
      ...handlers,
    }),
    [vacancyId, state, handlers],
  );

  return (
    <VacancyResponsesContext.Provider value={value}>
      {children}
    </VacancyResponsesContext.Provider>
  );
}

export function useVacancyResponses() {
  const context = useContext(VacancyResponsesContext);
  if (!context) {
    throw new Error(
      "useVacancyResponses must be used within VacancyResponsesProvider",
    );
  }
  return context;
}

export function useVacancyOperation(type: OperationType) {
  const context = useVacancyResponses();
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

export type { OperationType } from "./types";
