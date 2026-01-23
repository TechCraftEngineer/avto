import { useCallback, useState } from "react";
import { fetchRefreshVacancyResponsesToken } from "~/actions/realtime";
import { useRefreshSubscription } from "./use-refresh-subscription";

export interface RefreshStateData {
  dialogOpen: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "error";
  message: string;
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
    subscriptionActive: false,
  });

  // Refresh subscription
  useRefreshSubscription({
    vacancyId,
    enabled: state.subscriptionActive,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onMessage: useCallback((message: string) => {
      setState((prev) => ({ ...prev, message }));
    }, []),
    onStatusChange: useCallback(
      (status: string, message: string) => {
        if (status === "completed") {
          setState((prev) => ({ ...prev, status: "success" }));
          onRefreshComplete();
        } else {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: message,
          }));
          onRefreshComplete();
        }
      },
      [onRefreshComplete],
    ),
  });

  const handleRefreshClick = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      error: null,
      message: "",
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

  const handleDialogClose = useCallback(() => {
    if (state.status !== "loading") {
      setState((prev) => ({
        ...prev,
        dialogOpen: false,
        error: null,
        message: "",
        status: "idle",
        subscriptionActive: false,
      }));
    }
  }, [state.status]);

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
