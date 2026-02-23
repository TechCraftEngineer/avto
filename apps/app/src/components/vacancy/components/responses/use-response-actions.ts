"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  triggerRefreshVacancyResponses,
  triggerScreenAllResponses,
  triggerScreenNewResponses,
  triggerScreenResponsesBatch,
  triggerSendWelcomeBatch,
  triggerSyncArchivedVacancyResponses,
} from "~/actions/trigger";
import { useORPC } from "~/orpc/react";

export function useResponseActions(
  vacancyId: string,
  workspaceId: string,
  selectedIds: Set<string>,
  setSelectedIds: (ids: Set<string>) => void,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isProcessingNew, setIsProcessingNew] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [isSyncingArchived, setIsSyncingArchived] = useState(false);

  const orpc = useORPC();
  const queryClient = useQueryClient();

  const handleBulkScreen = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);

    try {
      const result = await triggerScreenResponsesBatch(
        Array.from(selectedIds),
        workspaceId,
      );

      if (!result.success) {
        console.error("Не удалось запустить пакетную оценку:", result.error);
        return;
      }

      console.log("Запущена оценка выбранных откликов");

      setSelectedIds(new Set());

      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({
            input: {
              workspaceId,
              vacancyId,
              sortDirection: "desc",
            },
          }),
        });
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedIds,
    setSelectedIds,
    queryClient,
    workspaceId,
    vacancyId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  const handleScreenAll = useCallback(async () => {
    setIsProcessingAll(true);

    try {
      const result = await triggerScreenAllResponses(vacancyId);

      if (!result.success) {
        console.error("Не удалось запустить оценку всех:", result.error);
        return;
      }

      console.log("Запущена оценка всех откликов");

      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({
            input: {
              workspaceId,
              vacancyId,
              sortDirection: "desc",
            },
          }),
        });
      }, 2000);
    } finally {
      setIsProcessingAll(false);
    }
  }, [
    vacancyId,
    workspaceId,
    queryClient,
    orpc.vacancy.responses.list.queryKey,
  ]);

  const handleScreenNew = useCallback(async () => {
    setIsProcessingNew(true);

    try {
      const result = await triggerScreenNewResponses(vacancyId);

      if (!result.success) {
        console.error("Не удалось запустить оценку новых:", result.error);
        toast.error("Не удалось запустить оценку откликов");
        setIsProcessingNew(false);
        return;
      }

      toast.success("Оценка новых откликов запущена");

      // Не сбрасываем isProcessingNew сразу - это будет сделано после закрытия диалога
    } catch (error) {
      console.error("Ошибка запуска оценки новых:", error);
      toast.error("Произошла ошибка");
      setIsProcessingNew(false);
    }
  }, [vacancyId]);

  const handleSyncArchived = useCallback(
    async (workspaceId: string) => {
      setIsSyncingArchived(true);

      try {
        const result = await triggerSyncArchivedVacancyResponses(
          vacancyId,
          workspaceId,
        );

        if (!result.success) {
          console.error(
            "Не удалось запустить синхронизацию архивных:",
            result.error,
          );
          toast.error("Не удалось запустить синхронизацию архивных откликов");
          setIsSyncingArchived(false);
          return;
        }

        toast.success("Синхронизация архивных откликов запущена");

        // Не сбрасываем isSyncingArchived сразу - это будет сделано после закрытия диалога
      } catch (error) {
        console.error("Ошибка запуска синхронизации архивных:", error);
        toast.error("Произошла ошибка");
        setIsSyncingArchived(false);
      }
    },
    [vacancyId],
  );

  const handleScreeningDialogClose = useCallback(() => {
    setIsProcessingNew(false);
    // Обновляем список откликов только для текущей вакансии
    void queryClient.invalidateQueries({
      queryKey: orpc.vacancy.responses.list.queryKey({
        input: { workspaceId, vacancyId },
      }),
    });
  }, [
    queryClient,
    vacancyId,
    workspaceId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  const handleRefreshResponses = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const result = await triggerRefreshVacancyResponses(
        vacancyId,
        workspaceId,
      );

      if (!result.success) {
        console.error("Не удалось запустить обновление:", result.error);
        setIsRefreshing(false);
        toast.error("Не удалось запустить обновление откликов");
        return result;
      }

      toast.success("Обновление откликов запущено");
      return result;
    } catch (error) {
      setIsRefreshing(false);
      toast.error("Произошла ошибка");
      throw error;
    }
  }, [vacancyId, workspaceId]);

  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
    setIsSyncingArchived(false);
    void queryClient.invalidateQueries({
      queryKey: orpc.vacancy.responses.list.queryKey({
        input: { workspaceId, vacancyId },
      }),
    });
  }, [
    queryClient,
    vacancyId,
    workspaceId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  const handleSendWelcomeBatch = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsSendingWelcome(true);

    try {
      const result = await triggerSendWelcomeBatch(Array.from(selectedIds));

      if (!result.success) {
        console.error(
          "Не удалось запустить пакетную отправку приветствий:",
          result.error,
        );
        return;
      }

      console.log("Запущена массовая отправка приветствий");

      setSelectedIds(new Set());

      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.list.queryKey({
            input: {
              workspaceId,
              vacancyId,
              sortDirection: "desc",
            },
          }),
        });
      }, 3000);
    } finally {
      setIsSendingWelcome(false);
    }
  }, [
    selectedIds,
    setSelectedIds,
    queryClient,
    vacancyId,
    workspaceId,
    orpc.vacancy.responses.list.queryKey,
  ]);

  return {
    isProcessing,
    isProcessingAll,
    isProcessingNew,
    isRefreshing,
    isSendingWelcome,
    isSyncingArchived,
    handleBulkScreen,
    handleScreenAll,
    handleScreenNew,
    handleSyncArchived,
    handleScreeningDialogClose,
    handleRefreshResponses,
    handleRefreshComplete,
    handleSendWelcomeBatch,
  };
}
