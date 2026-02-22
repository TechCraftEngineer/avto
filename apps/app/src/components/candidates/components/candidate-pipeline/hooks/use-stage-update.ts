import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

export function useStageUpdate() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  return useMutation(
    orpc.candidates.updateStage.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить стадию кандидата");
      },
      onSuccess: () => {
        toast.success("Стадия кандидата обновлена");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.candidates.list.queryKey(),
        });
      },
    }),
  );
}
