// Simple stub hook for stage queries
import type { FunnelCandidate, FunnelStage } from "../../../types/types";

interface StageQueryResult {
  stage: FunnelStage;
  query: {
    data?: {
      items: FunnelCandidate[];
      nextCursor?: string | null;
      total?: number;
    };
    isLoading: boolean;
    isFetching: boolean;
  };
}

export function useStageQueries(_params?: {
  workspaceId?: string;
  selectedVacancy?: string | null;
  debouncedSearch?: string;
  stageLimits?: Record<FunnelStage, number>;
}): StageQueryResult[] {
  return [];
}
