import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    ...orpc.calendar.createEvent.mutationOptions(),
    onSuccess: (data, variables) => {
      toast.success("Событие добавлено в календарь", {
        action: data.htmlLink
          ? {
              label: "Открыть",
              onClick: () => window.open(data.htmlLink, "_blank"),
            }
          : undefined,
      });
      // Обновляем данные отклика, чтобы показать запланированное собеседование
      void queryClient.invalidateQueries({
        queryKey: orpc.vacancy.responses.get.queryKey({
          input: {
            id: variables.responseId,
            workspaceId: variables.workspaceId,
          },
        }),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
