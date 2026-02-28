import { relations } from "drizzle-orm";
import { workspace } from "../workspace/workspace";
import { pipelineStage } from "./pipeline-stage";

export const pipelineStageRelations = relations(pipelineStage, ({ one }) => ({
  workspace: one(workspace, {
    fields: [pipelineStage.workspaceId],
    references: [workspace.id],
  }),
}));
