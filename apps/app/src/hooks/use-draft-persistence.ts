"use client";

import type { Draft, UpdateDraftInput } from "@qbs-autonaim/shared";
import { VacancyDataSchema } from "@qbs-autonaim/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useORPC } from "~/orpc/react";
import {
  DraftErrorHandler,
  type DraftErrorInfo,
  DraftErrorType,
  LocalDraftStorage,
} from "~/utils/draft-error-handler";

/** Схема для валидации draftData из API (timestamp как строка) */
const RawMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.union([z.string(), z.date()]),
  quickReplies: z.array(z.unknown()).optional(),
  isMultiSelect: z.boolean().optional(),
});

const DraftDataSchema = z.object({
  conversationHistory: z.array(RawMessageSchema).optional().default([]),
  vacancyData: VacancyDataSchema.optional().default({}),
  currentStep: z.string().optional().default("initial"),
});

/**
 * Статус сохранения черновика
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Опции для хука useDraftPersistence
 */
interface UseDraftPersistenceOptions {
  /**
   * Callback, вызываемый при восстановлении черновика
   */
  onRestore?: (draft: Draft) => void;

  /**
   * Задержка debounce в миллисекундах (по умолчанию 1000мс)
   */
  debounceMs?: number;

  /**
   * ID пользователя для локального хранилища
   */
  userId?: string;
}

/**
 * React хук для автоматического сохранения черновиков вакансий
 *
 * Обеспечивает:
 * - Автоматическое сохранение с debounce (1 секунда)
 * - Проверку наличия черновика при монтировании
 * - Восстановление черновика
 * - Управление состоянием сохранения
 * - Обработку ошибок с graceful degradation
 *
 * Требования: 1.2, 1.5, 2.1, 6.4, 7.1, 7.2, 7.3, 7.4
 *
 * @example
 * ```tsx
 * const {
 *   saveDraft,
 *   restoreDraft,
 *   startNew,
 *   clearDraft,
 *   saveStatus,
 *   lastSavedAt,
 *   showRestorePrompt,
 *   errorInfo,
 * } = useDraftPersistence({
 *   onRestore: (draft) => {
 *     // Восстановить состояние AI-бота
 *     setMessages(draft.conversationHistory);
 *     setVacancyData(draft.vacancyData);
 *   },
 *   userId: session.user.id,
 * });
 * ```
 */
export function useDraftPersistence(options: UseDraftPersistenceOptions = {}) {
  const { onRestore, debounceMs = 1000, userId } = options;

  const orpc = useORPC();
  const queryClient = useQueryClient();

  // Состояние
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<Draft | null>(null);
  const [errorInfo, setErrorInfo] = useState<DraftErrorInfo | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const statusResetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMountedRef = useRef(true);
  const hasDraftRef = useRef(false);
  const pendingDataRef = useRef<UpdateDraftInput | null>(null);

  // Запрос текущего черновика
  const { data: currentDraft } = useQuery(
    orpc.draft.getCurrent.queryOptions({}),
  );

  // Мутации
  const createMutation = useMutation(orpc.draft.create.mutationOptions());
  const updateMutation = useMutation(orpc.draft.update.mutationOptions());
  const deleteMutation = useMutation(orpc.draft.delete.mutationOptions());

  // Отслеживание монтирования
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Проверка наличия черновика при монтировании
  useEffect(() => {
    if (currentDraft && !hasDraftRef.current) {
      const parsed = DraftDataSchema.safeParse(currentDraft.draftData);
      if (!parsed.success) {
        console.error("Ошибка валидации draftData:", parsed.error.message);
        return;
      }
      const data = parsed.data;

      const mappedDraft: Draft = {
        id: currentDraft.id,
        userId: currentDraft.userId,
        conversationHistory: data.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp:
            msg.timestamp instanceof Date
              ? msg.timestamp
              : new Date(msg.timestamp),
          ...(msg.quickReplies && { quickReplies: msg.quickReplies }),
          ...(msg.isMultiSelect !== undefined && {
            isMultiSelect: msg.isMultiSelect,
          }),
        })),
        vacancyData: data.vacancyData,
        currentStep: data.currentStep,
        createdAt: currentDraft.createdAt,
        updatedAt: currentDraft.updatedAt,
      };

      setRestoredDraft(mappedDraft);
      setShowRestorePrompt(true);
    }
  }, [currentDraft]);

  // Проверка локального хранилища при недоступности сервера
  useEffect(() => {
    if (useLocalStorage && userId) {
      const localDraft = LocalDraftStorage.load(userId);
      if (localDraft && !hasDraftRef.current) {
        // Показать уведомление о наличии локальной резервной копии
        console.log("Найдена локальная резервная копия черновика");
      }
    }
  }, [useLocalStorage, userId]);

  /**
   * Сохранить черновик с debounce и обработкой ошибок
   *
   * Требования: 1.2, 1.5, 6.4, 7.1, 7.2
   * Свойство 2: Автоматическое сохранение изменений
   * Свойство 12: Debounce группировки изменений
   */
  const saveDraft = (data: UpdateDraftInput) => {
    // Очистить предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Сохранить данные для повторной попытки
    pendingDataRef.current = data;

    setSaveStatus("saving");
    setErrorInfo(null);

    // Установить новый таймер
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (hasDraftRef.current) {
          await updateMutation.mutateAsync(data);
        } else {
          await createMutation.mutateAsync(data);
          hasDraftRef.current = true;
        }

        if (!isMountedRef.current) return;
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        setUseLocalStorage(false);

        if (userId) {
          LocalDraftStorage.clear();
        }

        if (statusResetTimeoutRef.current) {
          clearTimeout(statusResetTimeoutRef.current);
        }
        statusResetTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus("idle");
          }
          statusResetTimeoutRef.current = undefined;
        }, 2000);
      } catch (error) {
        console.error("Ошибка сохранения черновика:", error);

        const errorDetails = DraftErrorHandler.handle(error);
        if (!isMountedRef.current) return;
        setErrorInfo(errorDetails);
        setSaveStatus("error");

        if (
          errorDetails.type === DraftErrorType.NETWORK &&
          userId &&
          data.conversationHistory &&
          data.vacancyData &&
          data.currentStep
        ) {
          LocalDraftStorage.save(userId, {
            conversationHistory: data.conversationHistory,
            vacancyData: data.vacancyData,
            currentStep: data.currentStep,
          });
          if (isMountedRef.current) {
            setUseLocalStorage(true);
          }
          console.log(
            "Черновик сохранен локально. Будет синхронизирован при восстановлении соединения.",
          );
        }
      }
    }, debounceMs);
  };

  /**
   * Восстановить черновик
   *
   * Требования: 2.3, 7.2
   * Свойство 4: Восстановление черновика при возврате
   */
  const restoreDraft = () => {
    if (restoredDraft && onRestore) {
      onRestore(restoredDraft);
      hasDraftRef.current = true;
    }
    setShowRestorePrompt(false);
  };

  /**
   * Начать заново (удалить текущий черновик)
   *
   * Требования: 2.4, 7.2
   * Свойство 5: Замена черновика при создании нового
   */
  const startNew = async () => {
    const snapshot = {
      showRestorePrompt,
      restoredDraft,
      hasDraft: hasDraftRef.current,
    };

    setShowRestorePrompt(false);
    setRestoredDraft(null);
    hasDraftRef.current = false;
    setErrorInfo(null);
    if (userId) {
      LocalDraftStorage.clear();
    }

    try {
      if (snapshot.restoredDraft) {
        await deleteMutation.mutateAsync(undefined);
      }
    } catch (error) {
      console.error("Ошибка при удалении черновика:", error);
      setShowRestorePrompt(snapshot.showRestorePrompt);
      setRestoredDraft(snapshot.restoredDraft);
      hasDraftRef.current = snapshot.hasDraft;
      const errorDetails = DraftErrorHandler.handle(error);
      setErrorInfo(errorDetails);
    }
  };

  /**
   * Удалить черновик
   *
   * Требования: 5.1, 5.4, 7.2
   * Свойство 11: Очистка черновика после создания вакансии
   */
  const clearDraft = async () => {
    const snapshot = {
      hasDraft: hasDraftRef.current,
      saveStatus,
      lastSavedAt,
      errorInfo,
    };

    hasDraftRef.current = false;
    setSaveStatus("idle");
    setLastSavedAt(null);
    setErrorInfo(null);
    if (userId) {
      LocalDraftStorage.clear();
    }

    try {
      await deleteMutation.mutateAsync(undefined);
      await queryClient.invalidateQueries({
        queryKey: orpc.draft.getCurrent.queryKey({}),
      });
    } catch (error) {
      console.error("Ошибка при удалении черновика:", error);
      hasDraftRef.current = snapshot.hasDraft;
      setSaveStatus(snapshot.saveStatus);
      setLastSavedAt(snapshot.lastSavedAt);
      const errorDetails = DraftErrorHandler.handle(error);
      setErrorInfo(errorDetails);
    }
  };

  /**
   * Повторить попытку сохранения
   *
   * Требования: 1.4, 1.5, 7.1
   */
  const retrySave = () => {
    if (pendingDataRef.current) {
      saveDraft(pendingDataRef.current);
    }
  };

  /**
   * Синхронизировать локальные данные с сервером
   *
   * Требования: 7.1, 7.2
   */
  const syncLocalData = useCallback(async () => {
    if (!userId || !useLocalStorage) {
      return;
    }

    const localDraft = LocalDraftStorage.load(userId);
    if (localDraft) {
      try {
        if (hasDraftRef.current) {
          await updateMutation.mutateAsync(localDraft);
        } else {
          await createMutation.mutateAsync(localDraft);
          hasDraftRef.current = true;
        }

        LocalDraftStorage.clear();
        setUseLocalStorage(false);
        console.log("Локальные данные успешно синхронизированы с сервером");
      } catch (error) {
        console.error("Ошибка синхронизации локальных данных:", error);
        const errorDetails = DraftErrorHandler.handle(error);
        setErrorInfo(errorDetails);
      }
    }
  }, [userId, useLocalStorage, updateMutation, createMutation]);

  // Попытка синхронизации при восстановлении соединения
  useEffect(() => {
    if (useLocalStorage) {
      const handleOnline = () => {
        console.log("Соединение восстановлено, синхронизация данных...");
        void syncLocalData();
      };

      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [useLocalStorage, syncLocalData]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = undefined;
      }
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = undefined;
      }
    };
  }, []);

  return {
    saveDraft,
    restoreDraft,
    startNew,
    clearDraft,
    retrySave,
    syncLocalData,
    saveStatus,
    lastSavedAt,
    showRestorePrompt,
    restoredDraft,
    errorInfo,
    useLocalStorage,
  };
}
