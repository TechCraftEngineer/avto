"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  triggerRefreshAllResumes,
  triggerRefreshVacancyResponses,
  triggerScreenAllResponses,
  triggerScreenNewResponses,
  triggerScreenResponsesBatch,
  triggerSendWelcomeBatch,
  triggerSyncArchivedVacancyResponses,
} from "~/actions/trigger";
import { useTRPC } from "~/trpc/react";

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
  const [isRefreshingAllResumes, setIsRefreshingAllResumes] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [isSyncingArchived, setIsSyncingArchived] = useState(false);

  const trpc = useTRPC();
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
        void queryClient.invalidateQueries(
          trpc.vacancy.responses.list.pathFilter(),
        );
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedIds,
    setSelectedIds,
    queryClient,
    trpc.vacancy.responses.list,
    workspaceId,
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
        void queryClient.invalidateQueries(
          trpc.vacancy.responses.list.pathFilter(),
        );
      }, 2000);
    } finally {
      setIsProcessingAll(false);
    }
  }, [vacancyId, queryClient, trpc.vacancy.responses.list]);

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
    // Обновляем список откликов после закрытия диалога
    void queryClient.invalidateQueries(
      trpc.vacancy.responses.list.pathFilter(),
    );
  }, [queryClient, trpc.vacancy.responses.list]);

  const handleRefreshResponses = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const result = await triggerRefreshVacancyResponses(vacancyId);

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
  }, [vacancyId]);

  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
    void queryClient.invalidateQueries(
      trpc.vacancy.responses.list.pathFilter(),
    );
  }, [queryClient, trpc.vacancy.responses.list]);

  const handleRefreshAllResumes = useCallback(async () => {
    setIsRefreshingAllResumes(true);

    try {
      const result = await triggerRefreshAllResumes(vacancyId);

      if (!result.success) {
        console.error(
          "Не удалось запустить обновление всех резюме:",
          result.error,
        );
        toast.error("Не удалось запустить обновление резюме");
        setIsRefreshingAllResumes(false);
        return;
      }

      toast.success("Обновление всех резюме запущено");

      // Не сбрасываем isRefreshingAllResumes сразу - это будет сделано после закрытия диалога
    } catch (error) {
      console.error("Ошибка запуска обновления всех резюме:", error);
      toast.error("Произошла ошибка");
      setIsRefreshingAllResumes(false);
    }
  }, [vacancyId]);

  const handleRefreshAllResumesDialogClose = useCallback(() => {
    setIsRefreshingAllResumes(false);
    // Обновляем список откликов после закрытия диалога
    void queryClient.invalidateQueries(
      trpc.vacancy.responses.list.pathFilter(),
    );
  }, [queryClient, trpc.vacancy.responses.list]);

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
        void queryClient.invalidateQueries(
          trpc.vacancy.responses.list.pathFilter(),
        );
      }, 3000);
    } finally {
      setIsSendingWelcome(false);
    }
  }, [selectedIds, setSelectedIds, queryClient, trpc.vacancy.responses.list]);

  return {
    isProcessing,
    isProcessingAll,
    isProcessingNew,
    isRefreshing,
    isRefreshingAllResumes,
    isSendingWelcome,
    isSyncingArchived,
    handleBulkScreen,
    handleScreenAll,
    handleScreenNew,
    handleSyncArchived,
    handleScreeningDialogClose,
    handleRefreshResponses,
    handleRefreshComplete,
    handleRefreshAllResumes,
    handleRefreshAllResumesDialogClose,
    handleSendWelcomeBatch,
  };
}
