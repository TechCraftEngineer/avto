import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";
import type { FunnelCandidate, FunnelStage } from "../types";

interface StageQuery {
  stage: FunnelStage;
  queryKey: unknown[];
  query: {
    data?: { items: FunnelCandidate[]; nextCursor?: string; total?: number };
  };
}

export function useStageUpdate(stageQueries: StageQuery[]) {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  return useMutation(
    orpc.candidates.updateStage.mutationOptions({
      onMutate: async (newStageData) => {
        await Promise.all(
          stageQueries.map((sq) =>
            queryClient.cancelQueries({ queryKey: sq.queryKey }),
          ),
        );

        const previousData: Record<string, unknown> = {};

        stageQueries.forEach((sq) => {
          const data = queryClient.getQueryData(sq.queryKey);
          if (data) {
            previousData[sq.stage] = data;
          }
        });

        const oldStage = stageQueries.find((sq) => {
          const data = sq.query.data;
          return data?.items.some((c) => c.id === newStageData.candidateId);
        });

        if (oldStage) {
          queryClient.setQueryData(
            oldStage.queryKey,
            (
              old:
                | {
                    items: FunnelCandidate[];
                    nextCursor?: string;
                    total?: number;
                  }
                | undefined,
            ) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.filter(
                  (c: FunnelCandidate) => c.id !== newStageData.candidateId,
                ),
              };
            },
          );

          const newStageQuery = stageQueries.find(
            (sq) => sq.stage === newStageData.stage,
          );
          if (newStageQuery) {
            const candidate = oldStage.query.data?.items.find(
              (c) => c.id === newStageData.candidateId,
            );
            if (candidate) {
              queryClient.setQueryData(
                newStageQuery.queryKey,
                (
                  old:
                    | {
                        items: FunnelCandidate[];
                        nextCursor?: string;
                        total?: number;
                      }
                    | undefined,
                ) => {
                  if (!old) return old;
                  return {
                    ...old,
                    items: [
                      { ...candidate, stage: newStageData.stage },
                      ...old.items,
                    ],
                  };
                },
              );
            }
          }
        }

        return { previousData };
      },
      onError: (_err, _newStageData, context) => {
        if (context?.previousData) {
          Object.entries(context.previousData).forEach(([stage, data]) => {
            const sq = stageQueries.find((q) => q.stage === stage);
            if (sq) {
              queryClient.setQueryData(sq.queryKey, data);
            }
          });
        }
      },
      onSettled: () => {
        stageQueries.forEach((sq) => {
          queryClient.invalidateQueries({ queryKey: sq.queryKey });
        });
      },
    }),
  );
}
