"use client";

import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";
import { z } from "zod";

const ProgressDataSchema = z.object({
  status: z.string(),
  message: z.string(),
  total: z.number().optional(),
  processed: z.number().optional(),
  failed: z.number().optional(),
});

const ResultDataSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  processed: z.number(),
  failed: z.number(),
});

export interface RefreshAllResumesProgress {
  total: number;
  processed: number;
  failed: number;
}

interface UseRefreshAllResumesSubscriptionProps {
  vacancyId: string;
  enabled: boolean;
  fetchToken: (vacancyId: string) => Promise<Realtime.Subscribe.Token>;
  onProgress?: (
    message: string,
    progress: RefreshAllResumesProgress | null,
  ) => void;
  onComplete?: (success: boolean, progress: RefreshAllResumesProgress) => void;
}

export function useRefreshAllResumesSubscription({
  vacancyId,
  enabled,
  fetchToken,
  onProgress,
  onComplete,
}: UseRefreshAllResumesSubscriptionProps) {
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
        progressData.total !== undefined
          ? {
              total: progressData.total,
              processed: progressData.processed || 0,
              failed: progressData.failed || 0,
            }
          : null;
      onProgress?.(progressData.message, progress);
    } else if (data.topic === "result") {
      const parseResult = ResultDataSchema.safeParse(data.data);
      if (!parseResult.success) return;

      const resultData = parseResult.data;
      const progress = {
        total: resultData.total,
        processed: resultData.processed,
        failed: resultData.failed,
      };
      onComplete?.(resultData.success, progress);
    }
  }, [subscription.latestData, onProgress, onComplete]);

  return subscription;
}