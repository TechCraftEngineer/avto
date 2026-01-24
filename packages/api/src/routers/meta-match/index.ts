import { createTRPCRouter } from "../../trpc";
import { evaluateCandidate } from "./evaluate-candidate";
import { getAnalytics } from "./get-analytics";
import { getLatest } from "./get-latest";

export const metaMatchRouter = createTRPCRouter({
  getLatest,
  evaluateCandidate,
  getAnalytics,
});
