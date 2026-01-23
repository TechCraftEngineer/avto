import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";
import { z } from "zod";

const StatusDataSchema = z.object({
  status: z.enum(["completed", "error"]),
  message: z.string(),
  vacancyId: z.string().optional(),
});

interface StatusData {
  status: string;
  message: string;
  vacancyId?: string;
}

interface UseRefreshSubscriptionProps {
  vacancyId: string;
  enabled: boolean;
  fetchToken: (vacancyId: string) => Promise<Realtime.Subscribe.Token>;
  onStatusChange?: (status: "completed" | "error", message: string) => void;
  onMessage?: (message: string) => void;
}

export function useRefreshSubscription({
  vacancyId,
  enabled,
  fetchToken,
  onStatusChange,
  onMessage,
}: UseRefreshSubscriptionProps) {
  const subscription = useInngestSubscription({
    refreshToken: () => fetchToken(vacancyId),
    enabled,
  });

  useEffect(() => {
    if (!subscription.latestData) return;

    const data = subscription.latestData;
    if (data.kind !== "data" || data.topic !== "status") return;

    const parseResult = StatusDataSchema.safeParse(data.data);
    if (!parseResult.success) {
      onStatusChange?.("error", "invalid realtime payload");
      return;
    }

    const statusData = parseResult.data;
    onMessage?.(statusData.message);

    if (statusData.status === "completed") {
      onStatusChange?.("completed", statusData.message);
    } else if (statusData.status === "error") {
      onStatusChange?.("error", statusData.message);
    }
  }, [subscription.latestData, onStatusChange, onMessage]);

  return subscription;
}
