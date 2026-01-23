import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchSyncArchivedVacancyResponsesToken } from "~/actions/realtime";
import { useWorkspace } from "~/hooks/use-workspace";
import { useSyncArchivedSubscription } from "./use-sync-archived-subscription";

export interface SyncArchivedStateData {
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
  const { workspace } = useWorkspace();
  const [state, setState] = useState<SyncArchivedStateData>({
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

  // Sync archived subscription
  useSyncArchivedSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken: fetchSyncArchivedVacancyResponsesToken,
    onMessage: useCallback((message: string, data?: any) => {
      setState((prev) => {
        const newState = { ...prev, message };
        // Use data from realtime message if available
        if (data) {
          if (data.syncedResponses !== undefined) {
            newState.syncedCount = data.syncedResponses;
          }
          if (data.newResponses !== undefined) {
            newState.newCount = data.newResponses;
          }
          if (data.vacancyTitle) {
            newState.vacancyTitle = data.vacancyTitle;
          }
        }
        return newState;
      });
    }, []),
    onStatusChange: useCallback(
      (status: string, message: string) => {
        if (status === "completed") {
          setState((prev) => ({ ...prev, status: "success" }));
          onRefreshComplete();

          // Очищаем предыдущий таймер перед установкой нового
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(() => {
            handleDialogClose();
          }, 3000);
        } else {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: message,
          }));
          onRefreshComplete();
        }
      },
      [onRefreshComplete, handleDialogClose],
    ),
  });

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
      }));
    }
  }, [workspace, onSyncArchived]);

  const setDialogOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, dialogOpen: open }));
  }, []);

  return {
    ...state,
    handleClick,
    handleDialogClose,
    setDialogOpen,
  };
}
