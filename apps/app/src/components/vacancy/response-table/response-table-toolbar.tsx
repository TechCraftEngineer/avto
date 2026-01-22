import { Button, Input } from "@qbs-autonaim/ui";
import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { useWorkspace } from "~/hooks/use-workspace";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken,
  fetchSyncArchivedVacancyResponsesToken,
} from "~/actions/realtime";
import {
  ResponseFilters,
  ResponseStatusFilter as ResponseStatusFilterComponent,
  type ScreeningFilter,
} from "~/components/response";
import { RefreshDialog } from "./refresh-dialog";
import { ScreeningDialog } from "./screening-dialog";
import { SyncArchivedDialog } from "./sync-archived-dialog";
import { useRefreshSubscription } from "./use-refresh-subscription";
import { useSyncArchivedSubscription } from "./use-sync-archived-subscription";
import type { ResponseStatusFilterUI } from "./use-response-table";
import {
  type ScreeningProgress,
  useScreeningSubscription,
} from "./use-screening-subscription";

function getPluralForm(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

interface ResponseTableToolbarProps {
  vacancyId: string;
  totalResponses: number;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  statusFilter: ResponseStatusFilterUI[];
  onStatusFilterChange: (statuses: ResponseStatusFilterUI[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isProcessingAll: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onScreeningDialogClose: () => void;
}

export function ResponseTableToolbar({
  vacancyId,
  totalResponses,
  screeningFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  isRefreshing,
  isProcessingNew,
  isProcessingAll,
  onRefresh,
  onRefreshComplete,
  onScreenNew,
  onScreenAll,
  onScreeningDialogClose,
}: ResponseTableToolbarProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();
  // Refresh state
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [refreshMessage, setRefreshMessage] = useState<string>("");
  const [refreshSubscriptionActive, setRefreshSubscriptionActive] =
    useState(false);

  // Screen new state
  const [screenNewDialogOpen, setScreenNewDialogOpen] = useState(false);
  const [screenNewError, setScreenNewError] = useState<string | null>(null);
  const [screenNewStatus, setScreenNewStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [screenNewMessage, setScreenNewMessage] = useState<string>("");
  const [screenNewProgress, setScreenNewProgress] =
    useState<ScreeningProgress | null>(null);
  const [screenNewSubscriptionActive, setScreenNewSubscriptionActive] =
    useState(false);

  // Screen all state
  const [screenAllDialogOpen, setScreenAllDialogOpen] = useState(false);
  const [screenAllError, setScreenAllError] = useState<string | null>(null);
  const [screenAllStatus, setScreenAllStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [screenAllMessage, setScreenAllMessage] = useState<string>("");
  const [screenAllProgress, setScreenAllProgress] =
    useState<ScreeningProgress | null>(null);
  const [screenAllSubscriptionActive, setScreenAllSubscriptionActive] =
    useState(false);

  // Sync archived state
  const [syncArchivedDialogOpen, setSyncArchivedDialogOpen] = useState(false);
  const [syncArchivedError, setSyncArchivedError] = useState<string | null>(
    null,
  );
  const [syncArchivedStatus, setSyncArchivedStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [syncArchivedMessage, setSyncArchivedMessage] = useState<string>("");
  const [syncArchivedSyncedCount, setSyncArchivedSyncedCount] =
    useState<number>(0);
  const [syncArchivedNewCount, setSyncArchivedNewCount] = useState<number>(0);
  const [syncArchivedVacancyTitle, setSyncArchivedVacancyTitle] =
    useState<string>("");
  const [syncArchivedSubscriptionActive, setSyncArchivedSubscriptionActive] =
    useState(false);

  // Sync archived mutation
  const syncArchivedMutation = useMutation(
    trpc.freelancePlatforms.syncArchivedVacancyResponses.mutationOptions({
      onSuccess: () => {
        setSyncArchivedMessage("Задача запущена, ожидаем выполнения...");
        toast.success("Синхронизация архивных откликов запущена в фоне");
      },
      onError: (error) => {
        setSyncArchivedStatus("error");
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        setSyncArchivedError(errorMessage);
        toast.error(`Ошибка запуска синхронизации: ${errorMessage}`);
      },
    }),
  );

  // Timeout refs для предотвращения утечек памяти
  const screenNewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenAllTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncArchivedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh subscription
  useRefreshSubscription({
    vacancyId,
    enabled: refreshSubscriptionActive,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onMessage: setRefreshMessage,
    onStatusChange: (status, message) => {
      if (status === "completed") {
        setRefreshStatus("success");
        onRefreshComplete();
      } else {
        setRefreshStatus("error");
        setRefreshError(message);
        onRefreshComplete();
      }
    },
  });

  // Screen new subscription
  useScreeningSubscription({
    vacancyId,
    enabled: screenNewSubscriptionActive,
    fetchToken: fetchScreenNewResponsesToken,
    onProgress: (message, progress) => {
      setScreenNewMessage(message);
      if (progress) setScreenNewProgress(progress);
    },
    onComplete: (success, progress) => {
      setScreenNewProgress(progress);
      if (success) {
        setScreenNewStatus("success");
        setScreenNewMessage(
          `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`,
        );
      } else {
        setScreenNewStatus("error");
        setScreenNewError("Процесс завершился с ошибками");
      }

      // Очищаем предыдущий таймер перед установкой нового
      if (screenNewTimerRef.current) {
        clearTimeout(screenNewTimerRef.current);
      }
      screenNewTimerRef.current = setTimeout(
        () => handleScreenNewDialogClose(),
        3000,
      );
    },
  });

  // Screen all subscription
  useScreeningSubscription({
    vacancyId,
    enabled: screenAllSubscriptionActive,
    fetchToken: fetchScreenAllResponsesToken,
    onProgress: (message, progress) => {
      setScreenAllMessage(message);
      if (progress) setScreenAllProgress(progress);
    },
    onComplete: (success, progress) => {
      setScreenAllProgress(progress);
      if (success) {
        setScreenAllStatus("success");
        setScreenAllMessage(
          `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`,
        );
      } else {
        setScreenAllStatus("error");
        setScreenAllError("Процесс завершился с ошибками");
      }

      // Очищаем предыдущий таймер перед установкой нового
      if (screenAllTimerRef.current) {
        clearTimeout(screenAllTimerRef.current);
      }
      screenAllTimerRef.current = setTimeout(
        () => handleScreenAllDialogClose(),
        3000,
      );
    },
  });

  // Sync archived subscription
  useSyncArchivedSubscription({
    vacancyId,
    enabled: syncArchivedSubscriptionActive,
    fetchToken: fetchSyncArchivedVacancyResponsesToken,
    onMessage: (message) => {
      setSyncArchivedMessage(message);
      // Parse message for counts and title
      if (message.includes("Синхронизация завершена")) {
        const syncedMatch = message.match(/Обработано:\s*(\d+)/);
        const newMatch = message.match(/новых:\s*(\d+)/);

        if (syncedMatch?.[1]) {
          setSyncArchivedSyncedCount(parseInt(syncedMatch[1], 10));
        }
        if (newMatch?.[1]) {
          setSyncArchivedNewCount(parseInt(newMatch[1], 10));
        }
        // Note: vacancyTitle is not available in the message payload
        // It would need to be sent separately or fetched from vacancy data
      }
    },
    onStatusChange: (status, message) => {
      if (status === "completed") {
        setSyncArchivedStatus("success");
        onRefreshComplete();
      } else {
        setSyncArchivedStatus("error");
        setSyncArchivedError(message);
        onRefreshComplete();
      }
    },
  });

  // Handlers
  const handleRefreshClick = async () => {
    setRefreshError(null);
    setRefreshMessage("");
    setRefreshStatus("loading");
    setRefreshSubscriptionActive(true);

    try {
      await onRefresh();
    } catch (error) {
      setRefreshStatus("error");
      setRefreshError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleRefreshDialogClose = () => {
    if (refreshStatus !== "loading") {
      setRefreshDialogOpen(false);
      setRefreshError(null);
      setRefreshMessage("");
      setRefreshStatus("idle");
      setRefreshSubscriptionActive(false);
    }
  };

  const handleScreenNewClick = async () => {
    setScreenNewError(null);
    setScreenNewMessage("");
    setScreenNewProgress(null);
    setScreenNewStatus("loading");
    setScreenNewSubscriptionActive(true);

    try {
      await onScreenNew();
    } catch (error) {
      setScreenNewStatus("error");
      setScreenNewError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleScreenNewDialogClose = useCallback(() => {
    // Очищаем таймер при закрытии диалога
    if (screenNewTimerRef.current) {
      clearTimeout(screenNewTimerRef.current);
      screenNewTimerRef.current = null;
    }

    setScreenNewDialogOpen(false);
    setScreenNewError(null);
    setScreenNewMessage("");
    setScreenNewProgress(null);
    setScreenNewStatus("idle");
    setScreenNewSubscriptionActive(false);
    onScreeningDialogClose();
  }, [onScreeningDialogClose]);

  const handleScreenAllClick = async () => {
    setScreenAllError(null);
    setScreenAllMessage("");
    setScreenAllProgress(null);
    setScreenAllStatus("loading");
    setScreenAllSubscriptionActive(true);

    try {
      await onScreenAll();
    } catch (error) {
      setScreenAllStatus("error");
      setScreenAllError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleScreenAllDialogClose = useCallback(() => {
    // Очищаем таймер при закрытии диалога
    if (screenAllTimerRef.current) {
      clearTimeout(screenAllTimerRef.current);
      screenAllTimerRef.current = null;
    }

    setScreenAllDialogOpen(false);
    setScreenAllError(null);
    setScreenAllMessage("");
    setScreenAllProgress(null);
    setScreenAllStatus("idle");
    setScreenAllSubscriptionActive(false);
    onScreeningDialogClose();
  }, [onScreeningDialogClose]);

  // Sync archived handlers
  const handleSyncArchivedClick = () => {
    if (!workspace) {
      const errorMessage =
        "Не удалось запустить синхронизацию: рабочее пространство не найдено";
      setSyncArchivedError(errorMessage);
      setSyncArchivedStatus("error");
      toast.error(errorMessage);
      return;
    }

    setSyncArchivedError(null);
    setSyncArchivedMessage("");
    setSyncArchivedSyncedCount(0);
    setSyncArchivedNewCount(0);
    setSyncArchivedVacancyTitle("");
    setSyncArchivedStatus("loading");
    setSyncArchivedSubscriptionActive(true);

    syncArchivedMutation.mutate({
      workspaceId: workspace.id,
      vacancyId,
    });
  };

  const handleSyncArchivedDialogClose = () => {
    if (syncArchivedStatus !== "loading") {
      setSyncArchivedDialogOpen(false);
      setSyncArchivedError(null);
      setSyncArchivedMessage("");
      setSyncArchivedSyncedCount(0);
      setSyncArchivedNewCount(0);
      setSyncArchivedVacancyTitle("");
      setSyncArchivedStatus("idle");
      setSyncArchivedSubscriptionActive(false);
    }
  };

  // Очистка таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      if (screenNewTimerRef.current) {
        clearTimeout(screenNewTimerRef.current);
      }
      if (screenAllTimerRef.current) {
        clearTimeout(screenAllTimerRef.current);
      }
      if (syncArchivedTimerRef.current) {
        clearTimeout(syncArchivedTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 mb-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9 bg-background/60 border-border/60 hover:bg-background/80 focus-visible:bg-background transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <ResponseFilters
              selectedFilter={screeningFilter}
              onFilterChange={onFilterChange}
            />
            <ResponseStatusFilterComponent
              selectedStatuses={statusFilter}
              onStatusChange={onStatusFilterChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            onClick={() => setRefreshDialogOpen(true)}
            className="h-9 bg-background/60 border-border/60 hover:bg-background/80 transition-colors"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? "Обновление..." : "Синхронизировать"}
          </Button>

          <Button
            disabled={syncArchivedStatus === "loading"}
            variant="outline"
            size="sm"
            onClick={() => setSyncArchivedDialogOpen(true)}
            className="h-9 bg-background/60 border-border/60 border-dashed hover:bg-background/80 transition-colors"
          >
            {syncArchivedStatus === "loading" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {syncArchivedStatus === "loading" ? "Синхронизация..." : "Архивные"}
          </Button>

          <Button
            disabled={isProcessingNew}
            variant="outline"
            size="sm"
            onClick={() => setScreenNewDialogOpen(true)}
            className="h-9 bg-background/60 border-border/60 border-dashed hover:bg-background/80 transition-colors"
          >
            {isProcessingNew ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Оценить новые
          </Button>

          <Button
            disabled={isProcessingAll}
            variant="default"
            size="sm"
            onClick={() => setScreenAllDialogOpen(true)}
            className="h-9 shadow-sm hover:shadow transition-shadow"
          >
            {isProcessingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Оценить всех ({totalResponses})
          </Button>
        </div>
      </div>

      <RefreshDialog
        open={refreshDialogOpen}
        status={refreshStatus}
        message={refreshMessage}
        error={refreshError}
        onOpenChange={setRefreshDialogOpen}
        onConfirm={handleRefreshClick}
        onClose={handleRefreshDialogClose}
      />

      <ScreeningDialog
        open={screenNewDialogOpen}
        title="Оценка новых откликов"
        description="Будет запущен процесс оценки новых откликов (без скрининга). Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически."
        status={screenNewStatus}
        message={screenNewMessage}
        error={screenNewError}
        progress={screenNewProgress}
        onOpenChange={(open) => {
          if (!open && screenNewStatus !== "loading") {
            handleScreenNewDialogClose();
          }
        }}
        onConfirm={handleScreenNewClick}
        onClose={handleScreenNewDialogClose}
      />

      <ScreeningDialog
        open={screenAllDialogOpen}
        title="Оценка всех откликов"
        description={`Вы собираетесь запустить оценку для ${totalResponses} ${getPluralForm(
          totalResponses,
          "отклика",
          "отклика",
          "откликов",
        )}. Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически.`}
        status={screenAllStatus}
        message={screenAllMessage}
        error={screenAllError}
        progress={screenAllProgress}
        onOpenChange={(open) => {
          if (!open && screenAllStatus !== "loading") {
            handleScreenAllDialogClose();
          }
        }}
        onConfirm={handleScreenAllClick}
        onClose={handleScreenAllDialogClose}
      />

      <SyncArchivedDialog
        open={syncArchivedDialogOpen}
        status={syncArchivedStatus}
        message={syncArchivedMessage}
        error={syncArchivedError}
        syncedCount={syncArchivedSyncedCount}
        newCount={syncArchivedNewCount}
        vacancyTitle={syncArchivedVacancyTitle}
        onOpenChange={(open) => {
          if (!open && syncArchivedStatus !== "loading") {
            handleSyncArchivedDialogClose();
          }
        }}
        onConfirm={handleSyncArchivedClick}
        onClose={handleSyncArchivedDialogClose}
      />
    </>
  );
}
