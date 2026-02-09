"use client";

import type { Realtime } from "@qbs-autonaim/inngest-realtimetime";
import { useInngestSubscription } from "@qbs-autonaim/inngest-realtimetime/hooks";
import { useEffect } from "react";
import { z } from "zod";

const ProgressDataSchema = z.object({
  vacancyId: z.string(),
  status: z.enum(["started", "processing", "completed", "error"]),
  message: z.string(),
  currentPage: z.number().optional(),
  totalSaved: z.number().optional(),
  totalSkipped: z.number().optional(),
});

const ResultDataSchema = z.object({
  vacancyId: z.string(),
  success: z.boolean(),
  newCount: z.number(),
  totalResponses: z.number(),
  error: z.string().optional(),
});

export interface RefreshProgress {
  currentPage: number;
  totalSaved: number;
  totalSkipped: number;
}

interface UseRefreshSubscriptionProps {
  vacancyId: string;
  enabled: boolean;
  fetchToken: (vacancyId: string) => Promise<Realtime.Subscribe.Token>;
  onProgress?: (message: string, progress: RefreshProgress | null) => void;
  onComplete?: (
    success: boolean,
    newCount: number,
    totalResponses: number,
  ) => void;
}

export function useRefreshSubscription({
  vacancyId,
  enabled,
  fetchToken,
  onProgress,
  onComplete,
}: UseRefreshSubscriptionProps) {
  const subscription = useInngestSubscription({
    refreshToken: () => fetchToken(vacancyId),
    enabled,
  });

  useEffect(() => {
    if (!subscription.latestData) return;

    const data = subscription.latestData;
    if (data.kind !== "data") return;

    if (data.topic === "progress") {
      const parseResult = ProgressDataSchema.safeParse(data.data);
      if (!parseResult.success) return;

      const progressData = parseResult.data;
      const progress =
        progressData.currentPage !== undefined &&
        progressData.totalSaved !== undefined &&
        progressData.totalSkipped !== undefined
          ? {
              currentPage: progressData.currentPage,
              totalSaved: progressData.totalSaved,
              totalSkipped: progressData.totalSkipped,
            }
          : null;
      onProgress?.(progressData.message, progress);
    } else if (data.topic === "result") {
      const parseResult = ResultDataSchema.safeParse(data.data);
      if (!parseResult.success) return;

      const resultData = parseResult.data;
      onComplete?.(
        resultData.success,
        resultData.newCount,
        resultData.totalResponses,
      );
    }
  }, [subscription.latestData, onProgress, onComplete]);

  return subscription;
}
