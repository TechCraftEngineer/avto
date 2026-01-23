import { createTRPCRouter } from "../../trpc";
import { evaluateCandidate } from "./evaluate-candidate";
import { getLatest } from "./get-latest";
import { getAnalytics } from "./get-analytics";

export const metaMatchRouter = createTRPCRouter({
  getLatest,
  evaluateCandidate,
  getAnalytics,
});
