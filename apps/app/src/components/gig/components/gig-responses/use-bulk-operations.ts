"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface UseBulkOperationsProps {
  gigId: string;
  workspaceId?: string;
}

export function useBulkOperations({ gigId, workspaceId }: UseBulkOperationsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const acceptMultipleMutation = useMutation(
    trpc.gig.responses.acceptMultiple.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Принято ${data.updatedCount} откликов`);
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({ gigId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const rejectMultipleMutation = useMutation(
    trpc.gig.responses.rejectMultiple.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Отклонено ${data.updatedCount} откликов`);
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({ gigId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAcceptMultiple = (responseIds: string[]) => {
    if (!workspaceId) return;
    acceptMultipleMutation.mutate({
      responseIds,
      workspaceId,
    });
  };

  const handleRejectMultiple = (responseIds: string[]) => {
    if (!workspaceId) return;
    rejectMultipleMutation.mutate({
      responseIds,
      workspaceId,
    });
  };

  return {
    handleAcceptMultiple,
    handleRejectMultiple,
    isAccepting: acceptMultipleMutation.isPending,
    isRejecting: rejectMultipleMutation.isPending,
  };
}
