import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import type { Response } from "./use-response-filters";

interface UseResponseMutationsProps {
  gigId: string;
  workspaceId: string | undefined;
  responses: Response[] | undefined;
}

export const useResponseMutations = ({
  gigId,
  workspaceId,
  responses: _responses,
}: UseResponseMutationsProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation(
    trpc.gig.responses.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspaceId ?? "",
          }),
        });
        toast.success("Отклик принят");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.gig.responses.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspaceId ?? "",
          }),
        });
        toast.success("Отклик отклонен");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const sendMessageMutation = useMutation(
    trpc.gig.responses.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Сообщение отправлено");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAccept = (responseId: string) => {
    if (!workspaceId) return;
    return acceptMutation.mutateAsync({
      responseId,
      workspaceId,
    });
  };

  const handleReject = (responseId: string) => {
    if (!workspaceId) return;
    return rejectMutation.mutateAsync({
      responseId,
      workspaceId,
    });
  };

  const handleSendMessage = (responseId: string, message: string) => {
    if (!workspaceId || !message.trim()) return;
    return sendMessageMutation.mutateAsync({
      responseId,
      workspaceId,
      message: message.trim(),
    });
  };

  const isProcessing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    sendMessageMutation.isPending;

  return {
    handleAccept,
    handleReject,
    handleSendMessage,
    isProcessing,
    mutations: {
      accept: acceptMutation,
      reject: rejectMutation,
      sendMessage: sendMessageMutation,
    },
  };
};
