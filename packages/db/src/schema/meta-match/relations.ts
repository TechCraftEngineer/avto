import { relations } from "drizzle-orm";
import { user } from "../auth";
import { response } from "../response/response";
import { metaMatchReport } from "./meta-match-report";

export const metaMatchReportRelations = relations(metaMatchReport, ({ one }) => ({
  candidateResponse: one(response, {
    fields: [metaMatchReport.candidateId],
    references: [response.id],
  }),
  requestedByUser: one(user, {
    fields: [metaMatchReport.requestedBy],
    references: [user.id],
  }),
}));
