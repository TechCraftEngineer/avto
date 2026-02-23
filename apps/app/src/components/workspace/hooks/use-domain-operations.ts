import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

interface UseDomainOperationsProps {
  workspaceId: string;
}

export function useDomainOperations({ workspaceId }: UseDomainOperationsProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation(
    orpc.customDomain.verify.mutationOptions({
      onSuccess: () => {
        toast.success("Домен верифицирован", {
          description: "Теперь вы можете использовать этот домен",
        });
        queryClient.invalidateQueries({
          queryKey: orpc.customDomain.list.queryKey({
            input: { workspaceId },
          }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка верификации", {
          description: error.message,
        });
      },
    }),
  );

  const setPrimaryMutation = useMutation(
    orpc.customDomain.setPrimary.mutationOptions({
      onSuccess: () => {
        toast.success("Основной домен изменён");
        queryClient.invalidateQueries({
          queryKey: orpc.customDomain.list.queryKey({
            input: { workspaceId },
          }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    orpc.customDomain.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Домен удалён");
        queryClient.invalidateQueries({
          queryKey: orpc.customDomain.list.queryKey({
            input: { workspaceId },
          }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  const createMutation = useMutation(
    orpc.customDomain.create.mutationOptions({
      onSuccess: () => {
        toast.success("Домен добавлен", {
          description: "Теперь настройте DNS записи для верификации",
        });
        queryClient.invalidateQueries({
          queryKey: orpc.customDomain.list.queryKey({ input: { workspaceId } }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  return {
    verify: verifyMutation.mutate,
    setPrimary: setPrimaryMutation.mutate,
    deleteDomain: deleteMutation.mutate,
    create: createMutation.mutate,
    isVerifying: verifyMutation.isPending,
    isSettingPrimary: setPrimaryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreating: createMutation.isPending,
  };
}

export function useDomains(workspaceId: string) {
  const orpc = useORPC();

  return useQuery({
    ...orpc.customDomain.list.queryOptions({
      input: { workspaceId },
    }),
    enabled: !!workspaceId,
  });
}
