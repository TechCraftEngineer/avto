// Simple stub hook for stage update
import type { FunnelStage } from "../../../types/types";

interface UpdateStageParams {
  workspaceId: string;
  candidateId: string;
  stage: FunnelStage;
}

export function useStageUpdate(_stageQueries?: unknown) {
  return {
    mutate: (_params: UpdateStageParams) => {},
  };
}
