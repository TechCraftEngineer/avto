// Simple stub hook for stage pagination
import type { FunnelStage } from "../../../types/types";

export function useStagePagination() {
  const stageLimits: Record<FunnelStage, number> = {
    SCREENING_DONE: 10,
    INTERVIEW: 10,
    OFFER_SENT: 10,
    SECURITY_PASSED: 10,
    CONTRACT_SENT: 10,
    ONBOARDING: 10,
    REJECTED: 10,
  };
  const loadMoreForStage = (_stage: FunnelStage) => {};

  return {
    stageLimits,
    loadMoreForStage,
  };
}
