import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";

interface ProgressData {
  status: string;
  message: string;
  total?: number;
  processed?: number;
  failed?: number;
}

interface ResultData {
  success: boolean;
  total: number;
  processed: number;
  failed: number;
}

export interface ScreeningProgress {
  total: number;
  processed: number;
  failed: number;
}

interface UseScreeningSubscriptionProps {
  vacancyId: string;
  enabled: boolean;
  fetchToken: (vacancyId: string) => Promise<Realtime.Subscribe.Token>;
  onProgress?: (message: string, progress: ScreeningProgress | null) => void;
  onComplete?: (success: boolean, progress: ScreeningProgress) => void;
}

export function useScreeningSubscription({
  vacancyId,
  enabled,
  fetchToken,
  onProgress,
  onComplete,
}: UseScreeningSubscriptionProps) {
  const subscription = useInngestSubscription({
    refreshToken: () => fetchToken(vacancyId),
    enabled,
  });

  useEffect(() => {
    if (!subscription.latestData) return;

    const data = subscription.latestData;
    if (data.kind !== "data") return;

    if (data.topic === "progress") {
      const progressData = data.data as ProgressData;
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
      const resultData = data.data as ResultData;
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
