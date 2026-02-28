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
    onMutate: async (variables) => {
      const queryKey = orpc.vacancy.responses.get.queryKey({
        input: { id: variables.responseId, workspaceId: variables.workspaceId },
      });
      const previousData = queryClient.getQueryData(queryKey);
      const optimisticScheduledInterview = {
        scheduledAt: variables.scheduledAt,
        durationMinutes: variables.durationMinutes,
        calendarEventUrl: null as string | null,
      };
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (old && typeof old === "object" && old !== null) {
          return { ...old, scheduledInterview: optimisticScheduledInterview };
        }
        return old;
      });
      return { previousData, queryKey };
    },
    onSuccess: (data) => {
      toast.success("Событие добавлено в календарь", {
        action: data.htmlLink
          ? {
              label: "Открыть",
              onClick: () =>
                window.open(data.htmlLink, "_blank", "noopener,noreferrer"),
            }
          : undefined,
      });
    },
    onError: (error, _variables, context) => {
      toast.error(error.message);
      if (context?.previousData !== undefined && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: orpc.vacancy.responses.get.queryKey({
          input: {
            id: variables.responseId,
            workspaceId: variables.workspaceId,
          },
        }),
      });
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
