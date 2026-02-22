import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

export function useWorkspaceOperations() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const createWorkspaceMutation = useMutation(
    orpc.organization.createWorkspace.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace создан");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listWorkspaces.queryKey(),
        });
      },
      onError: (error) => {
        toast.error("Ошибка создания workspace", {
          description: error.message,
        });
      },
    }),
  );

  return {
    createWorkspace: createWorkspaceMutation.mutate,
    isCreatingWorkspace: createWorkspaceMutation.isPending,
  };
}
