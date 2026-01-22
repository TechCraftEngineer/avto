import { createTRPCRouter } from "../../trpc";
import { evaluateCandidate } from "./evaluate-candidate";
import { getLatest } from "./get-latest";

export const metaMatchRouter = createTRPCRouter({
  getLatest,
  evaluateCandidate,
});
