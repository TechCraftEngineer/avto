import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
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
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation(
    orpc.gig.responses.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.gig.responses.list.queryKey({
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
    orpc.gig.responses.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.gig.responses.list.queryKey({
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
    orpc.gig.responses.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Сообщение отправлено");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAccept = useCallback(
    (responseId: string) => {
      if (!workspaceId) return;
      return acceptMutation.mutateAsync({
        responseId,
        workspaceId,
      });
    },
    [workspaceId, acceptMutation],
  );

  const handleReject = useCallback(
    (responseId: string) => {
      if (!workspaceId) return;
      return rejectMutation.mutateAsync({
        responseId,
        workspaceId,
      });
    },
    [workspaceId, rejectMutation],
  );

  const handleSendMessage = useCallback(
    (responseId: string, message: string) => {
      if (!workspaceId || !message.trim()) return;
      return sendMessageMutation.mutateAsync({
        responseId,
        workspaceId,
        message: message.trim(),
      });
    },
    [workspaceId, sendMessageMutation],
  );

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
