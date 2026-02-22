import { createRouter } from "../../orpc";
import { evaluateCandidate } from "./evaluate-candidate";
import { getAnalytics } from "./get-analytics";
import { getLatest } from "./get-latest";

export const metaMatchRouter = createRouter({
  getLatest,
  evaluateCandidate,
  getAnalytics,
});
