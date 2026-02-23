import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

interface UseCandidateOperationsProps {
  workspaceId: string;
  vacancyId?: string;
}

export function useCandidateOperations({
  workspaceId,
  vacancyId,
}: UseCandidateOperationsProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const invalidateList = () => {
    void queryClient.invalidateQueries({
      queryKey: orpc.vacancy.responses.list.queryKey({
        input: { workspaceId, vacancyId },
      }),
    });
  };

  const inviteMutation = useMutation(
    orpc.candidates.inviteCandidate.mutationOptions({
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
    orpc.candidates.rejectCandidate.mutationOptions({
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
