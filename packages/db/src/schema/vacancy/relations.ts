import { relations } from "drizzle-orm";
import { user } from "../auth";
import { response } from "../response/response";
import { workspace } from "../workspace/workspace";
import { freelanceImportHistory } from "./freelance-import-history";
import { vacancy } from "./vacancy";
import { vacancyPublication } from "./vacancy-publication";

export const vacancyRelations = relations(vacancy, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [vacancy.workspaceId],
    references: [workspace.id],
  }),
  owner: one(user, {
    fields: [vacancy.ownerId],
    references: [user.id],
    relationName: "vacancyOwner",
  }),
  createdByUser: one(user, {
    fields: [vacancy.createdBy],
    references: [user.id],
    relationName: "vacancyCreator",
  }),
  responses: many(response),
  publications: many(vacancyPublication),
}));

export const vacancyPublicationRelations = relations(
  vacancyPublication,
  ({ one }) => ({
    vacancy: one(vacancy, {
      fields: [vacancyPublication.vacancyId],
      references: [vacancy.id],
    }),
  }),
);

export const freelanceImportHistoryRelations = relations(
  freelanceImportHistory,
  ({ one }) => ({
    vacancy: one(vacancy, {
      fields: [freelanceImportHistory.vacancyId],
      references: [vacancy.id],
    }),
    importedByUser: one(user, {
      fields: [freelanceImportHistory.importedBy],
      references: [user.id],
    }),
  }),
);
