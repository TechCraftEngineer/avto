import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface UseCandidateOperationsProps {
  workspaceId: string;
  vacancyId?: string;
}

export function useCandidateOperations({
  workspaceId,
  vacancyId,
}: UseCandidateOperationsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateList = () => {
    if (vacancyId) {
      void queryClient.invalidateQueries({
        queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
      });
    } else {
      void queryClient.invalidateQueries(
        trpc.vacancy.responses.list.pathFilter(),
      );
    }
  };

  const inviteMutation = useMutation(
    trpc.candidates.inviteCandidate.mutationOptions({
      onSuccess: () => {
        toast.success("Кандидат приглашён на собеседование");
        invalidateList();
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось пригласить кандидата");
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.candidates.rejectCandidate.mutationOptions({
      onSuccess: () => {
        toast.success("Кандидат отклонён");
        invalidateList();
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось отклонить кандидата");
      },
    }),
  );

  return {
    invite: (candidateId: string) =>
      inviteMutation.mutate({ candidateId, workspaceId }),
    reject: (candidateId: string) =>
      rejectMutation.mutate({ candidateId, workspaceId }),
    isInviting: inviteMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
