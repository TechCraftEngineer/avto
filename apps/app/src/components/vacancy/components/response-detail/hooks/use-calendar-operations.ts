import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

interface CreateEventParams {
  responseId: string;
  workspaceId: string;
  scheduledAt: Date;
  durationMinutes: number;
  title: string;
  description?: string;
  type: "technical" | "hr" | "final" | "phone" | "video";
}

export function useCalendarOperations() {
  const orpc = useORPC();

  const createEventMutation = useMutation(
    orpc.calendar.createEvent.mutationOptions({
      onSuccess: (data) => {
        toast.success("Событие добавлено в календарь", {
          action: data.htmlLink
            ? {
                label: "Открыть",
                onClick: () => window.open(data.htmlLink, "_blank"),
              }
            : undefined,
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return {
    createEvent: (params: CreateEventParams) =>
      createEventMutation.mutate(params),
    isCreating: createEventMutation.isPending,
  };
}

export function useUserIntegrations() {
  const orpc = useORPC();

  return useQuery(orpc.userIntegration.list.queryOptions());
}
