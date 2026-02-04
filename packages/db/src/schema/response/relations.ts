import { relations } from "drizzle-orm";
import { user } from "../auth";
import { candidate } from "../candidate/candidate";
import { file } from "../file";
import { gig } from "../gig/gig";
import { interviewSession } from "../interview/interview-session";
import { interviewScoring } from "../interview/scoring";
import { vacancy } from "../vacancy/vacancy";
import { response } from "./response";
import { responseComment } from "./response-comment";
import { responseHistory } from "./response-history";
import { responseScreening } from "./response-screening";
import { responseTag } from "./response-tag";

export const responseRelations = relations(response, ({ one, many }) => ({
  globalCandidate: one(candidate, {
    fields: [response.globalCandidateId],
    references: [candidate.id],
  }),
  // Полиморфные связи с сущностями
  gig: one(gig, {
    fields: [response.entityId],
    references: [gig.id],
  }),
  vacancy: one(vacancy, {
    fields: [response.entityId],
    references: [vacancy.id],
  }),
  portfolioFile: one(file, {
    fields: [response.portfolioFileId],
    references: [file.id],
    relationName: "response_portfolio_file",
  }),
  photoFile: one(file, {
    fields: [response.photoFileId],
    references: [file.id],
    relationName: "response_photo_file",
  }),
  resumePdfFile: one(file, {
    fields: [response.resumePdfFileId],
    references: [file.id],
    relationName: "response_resume_pdf_file",
  }),
  screening: one(responseScreening, {
    fields: [response.id],
    references: [responseScreening.responseId],
  }),
  interviewScoring: one(interviewScoring, {
    fields: [response.id],
    references: [interviewScoring.responseId],
  }),
  interviewSessions: many(interviewSession),
  comments: many(responseComment),
  history: many(responseHistory),
  tags: many(responseTag),
}));

export const responseScreeningRelations = relations(
  responseScreening,
  ({ one }) => ({
    response: one(response, {
      fields: [responseScreening.responseId],
      references: [response.id],
    }),
  }),
);

export const responseCommentRelations = relations(
  responseComment,
  ({ one }) => ({
    response: one(response, {
      fields: [responseComment.responseId],
      references: [response.id],
    }),
    author: one(user, {
      fields: [responseComment.authorId],
      references: [user.id],
    }),
  }),
);

export const responseHistoryRelations = relations(
  responseHistory,
  ({ one }) => ({
    response: one(response, {
      fields: [responseHistory.responseId],
      references: [response.id],
    }),
    user: one(user, {
      fields: [responseHistory.userId],
      references: [user.id],
    }),
  }),
);

export const responseTagRelations = relations(responseTag, ({ one }) => ({
  response: one(response, {
    fields: [responseTag.responseId],
    references: [response.id],
  }),
}));
