import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import type { FunnelStage } from "../../../types/types";

interface UpdateStageParams {
  workspaceId: string;
  candidateId: string;
  stage: FunnelStage;
}

export function useStageUpdate() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.candidates.updateStage.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить стадию кандидата");
      },
      onSuccess: () => {
        toast.success("Стадия кандидата обновлена");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.list.queryKey(),
        });
      },
    }),
  );
}
