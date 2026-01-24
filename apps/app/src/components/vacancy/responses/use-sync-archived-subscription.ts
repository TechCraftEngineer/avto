import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";
import { z } from "zod";

const StatusDataSchema = z.object({
  status: z.enum(["completed", "error", "started", "processing"]),
  message: z.string(),
  vacancyId: z.string().optional(),
  syncedResponses: z.number().optional(),
  newResponses: z.number().optional(),
  vacancyTitle: z.string().optional(),
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
    if (data.kind !== "data" || data.topic !== "status") return;

    const parseResult = StatusDataSchema.safeParse(data.data);
    if (!parseResult.success) {
      onStatusChange?.("error", "недопустимая realtime-полезная нагрузка");
      return;
    }

    const statusData = parseResult.data;
    onMessage?.(statusData.message, statusData);

    if (statusData.status === "completed") {
      onStatusChange?.("completed", statusData.message);
    } else if (statusData.status === "error") {
      onStatusChange?.("error", statusData.message);
    } else if (
      statusData.status === "started" ||
      statusData.status === "processing"
    ) {
      // Для промежуточных статусов просто обновляем сообщение
      // Статус UI остается "loading" до завершения или ошибки
    }
  }, [subscription.latestData, onStatusChange, onMessage]);

  return subscription;
}
