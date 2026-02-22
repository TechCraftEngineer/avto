import { createTRPCRouter } from "../../orpc";
import { evaluateCandidate } from "./evaluate-candidate";
import { getAnalytics } from "./get-analytics";
import { getLatest } from "./get-latest";

export const metaMatchRouter = router({
  getLatest,
  evaluateCandidate,
  getAnalytics,
});
