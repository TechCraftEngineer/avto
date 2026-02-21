import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

export function useWorkspaceOperations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createWorkspaceMutation = useMutation(
    trpc.organization.createWorkspace.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace создан");
        queryClient.invalidateQueries({
          queryKey: trpc.organization.listWorkspaces.queryKey(),
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
