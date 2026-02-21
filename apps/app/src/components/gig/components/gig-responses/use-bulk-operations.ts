"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface UseBulkOperationsProps {
  gigId: string;
  workspaceId?: string;
}

export function useBulkOperations({
  gigId,
  workspaceId,
}: UseBulkOperationsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const acceptMultipleMutation = useMutation(
    trpc.gig.responses.acceptMultiple.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Принято ${data.updatedCount} откликов`);
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey as unknown[];
            if (!Array.isArray(key) || key.length < 2) return false;
            const path = key[0];
            const opts = key[1] as { input?: { gigId?: string } } | undefined;
            const input = opts?.input ?? (key[1] as { gigId?: string });
            const pathArr = Array.isArray(path) ? path : [path];
            return (
              pathArr[0] === "gig" &&
              pathArr[1] === "responses" &&
              pathArr[2] === "list" &&
              input?.gigId === gigId
            );
          },
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
          predicate: (query) => {
            const key = query.queryKey as unknown[];
            if (!Array.isArray(key) || key.length < 2) return false;
            const path = key[0];
            const opts = key[1] as { input?: { gigId?: string } } | undefined;
            const input = opts?.input ?? (key[1] as { gigId?: string });
            const pathArr = Array.isArray(path) ? path : [path];
            return (
              pathArr[0] === "gig" &&
              pathArr[1] === "responses" &&
              pathArr[2] === "list" &&
              input?.gigId === gigId
            );
          },
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAcceptMultiple = (responseIds: string[]) => {
    if (!workspaceId) return Promise.reject(new Error("Workspace not loaded"));
    return acceptMultipleMutation.mutateAsync({
      responseIds,
      workspaceId,
    });
  };

  const handleRejectMultiple = (responseIds: string[]) => {
    if (!workspaceId) return Promise.reject(new Error("Workspace not loaded"));
    return rejectMultipleMutation.mutateAsync({
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
