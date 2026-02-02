// Simple stub hook for stage pagination
export function useStagePagination() {
  const stageLimits = {};
  const loadMoreForStage = () => {};

  return {
    stageLimits,
    loadMoreForStage,
  };
}
