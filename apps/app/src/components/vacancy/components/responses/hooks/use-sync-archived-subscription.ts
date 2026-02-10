"use client";

import type { Realtime } from "@bunworks/inngest-realtime";
import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useEffect } from "react";
import { z } from "zod";

const ProgressDataSchema = z.object({
  status: z.enum(["started", "processing", "error"]),
  message: z.string(),
  vacancyId: z.string(),
  syncedResponses: z.number().optional(),
  newResponses: z.number().optional(),
});

const ResultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  syncedResponses: z.number(),
  newResponses: z.number(),
  vacancyTitle: z.string(),
});

export interface StatusData {
  status: string;
  message: string;
  vacancyId?: string;
  syncedResponses?: number;
  newResponses?: number;
  vacancyTitle?: string;
}

interface UseSyncArchivedSubscriptionProps {
  vacancyId: string;
  enabled: boolean;
  fetchToken: (vacancyId: string) => Promise<Realtime.Subscribe.Token>;
  onStatusChange?: (status: "completed" | "error", message: string) => void;
  onMessage?: (message: string, data?: StatusData) => void;
}

export function useSyncArchivedSubscription({
  vacancyId,
  enabled,
  fetchToken,
  onStatusChange,
  onMessage,
}: UseSyncArchivedSubscriptionProps) {
  const subscription = useInngestSubscription({
    refreshToken: () => fetchToken(vacancyId),
    enabled,
  });

  useEffect(() => {
    if (!subscription.latestData) return;

    const data = subscription.latestData;
    if (data.kind !== "data") return;

    // Обрабатываем топик progress
    if (data.topic === "progress") {
      const parseResult = ProgressDataSchema.safeParse(data.data);
      if (!parseResult.success) {
        onStatusChange?.("error", "недопустимая realtime-полезная нагрузка");
        return;
      }

      const progressData = parseResult.data;
      onMessage?.(progressData.message, {
        status: progressData.status,
        message: progressData.message,
        vacancyId: progressData.vacancyId,
        syncedResponses: progressData.syncedResponses,
        newResponses: progressData.newResponses,
      });

      if (progressData.status === "error") {
        onStatusChange?.("error", progressData.message);
      }
    }

    // Обрабатываем топик result
    if (data.topic === "result") {
      const parseResult = ResultDataSchema.safeParse(data.data);
      if (!parseResult.success) {
        onStatusChange?.("error", "недопустимая realtime-полезная нагрузка");
        return;
      }

      const resultData = parseResult.data;
      const message = `Синхронизация завершена. Обработано: ${resultData.syncedResponses}, новых: ${resultData.newResponses}`;

      onMessage?.(message, {
        status: "completed",
        message,
        vacancyId: resultData.vacancyId,
        syncedResponses: resultData.syncedResponses,
        newResponses: resultData.newResponses,
        vacancyTitle: resultData.vacancyTitle,
      });

      onStatusChange?.("completed", message);
    }
  }, [subscription.latestData, onStatusChange, onMessage]);

  return subscription;
}
