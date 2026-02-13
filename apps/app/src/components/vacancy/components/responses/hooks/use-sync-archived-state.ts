"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useVacancyOperation, useVacancyResponses } from "../context/vacancy-responses-context";

export interface SyncArchivedStateData {
  vacancyId: string;
  dialogOpen: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  syncedCount: number;
  newCount: number;
  vacancyTitle: string;
  subscriptionActive: boolean;
}

export interface SyncArchivedState extends SyncArchivedStateData {
  setDialogOpen: (open: boolean) => void;
  handleClick: () => Promise<void>;
  handleDialogClose: () => void;
}

export function useSyncArchivedState(
  vacancyId: string,
  onSyncArchived: (workspaceId: string) => void,
  onRefreshComplete: () => void,
) {
  const archivedOp = useVacancyOperation("archived");
  const { registerOnArchivedSyncComplete } = useVacancyResponses();
  const { workspace } = useWorkspace();
  const [state, setState] = useState<SyncArchivedStateData>({
    vacancyId,
    dialogOpen: false,
    error: null,
    status: "idle",
    message: "",
    syncedCount: 0,
    newCount: 0,
    vacancyTitle: "",
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
      syncedCount: 0,
      newCount: 0,
      vacancyTitle: "",
      status: "idle",
      subscriptionActive: false,
    }));
  }, []);

  // Регистрируем колбэк для вызова при завершении sync archived.
  // Прогресс и результат приходят через RefreshStatusIndicator (один WebSocket).
  useEffect(() => {
    registerOnArchivedSyncComplete(onRefreshComplete);
    return () => registerOnArchivedSyncComplete(null);
  }, [onRefreshComplete, registerOnArchivedSyncComplete]);

  const handleClick = useCallback(async () => {
    if (!workspace) {
      const errorMessage =
        "Не удалось запустить синхронизацию: рабочее пространство не найдено";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        status: "error",
      }));
      toast.error(errorMessage);
      return;
    }

    setState((prev) => ({
      ...prev,
      error: null,
      message: "",
      syncedCount: 0,
      newCount: 0,
      vacancyTitle: "",
      status: "loading",
      subscriptionActive: true,
    }));

    try {
      await onSyncArchived(workspace.id);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Произошла ошибка",
        subscriptionActive: false,
      }));
      onRefreshComplete();
    }
  }, [workspace, onSyncArchived, onRefreshComplete]);

  const setDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, dialogOpen: open }));
  }, []);

  // Регистрируем обработчик в Context
  useEffect(() => {
    archivedOp.setHandler(handleClick);
  }, [handleClick, archivedOp]);

  return {
    ...state,
    handleClick,
    handleDialogClose,
    setDialogOpen,
  };
}
