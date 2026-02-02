import { useMemo } from "react";
import type { Response } from "./use-response-filters";

export const useResponseStats = (responses: Response[] | undefined) => {
  const stats = useMemo(() => {
    if (!responses) return { total: 0, new: 0, evaluated: 0, recommended: 0 };

    return {
      total: responses.length,
      new: responses.filter((r) => r.status === "NEW").length,
      evaluated: responses.filter((r) => r.status === "EVALUATED").length,
      recommended: responses.filter(
        (r) => r.hrSelectionStatus === "RECOMMENDED",
      ).length,
    };
  }, [responses]);

  return stats;
};
