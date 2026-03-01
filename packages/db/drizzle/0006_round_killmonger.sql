DROP INDEX "pipeline_stages_workspace_entity_position_idx";--> statement-breakpoint
DROP INDEX "pipeline_stages_workspace_entity_position_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stages_default_position_unique" ON "pipeline_stages" USING btree ("workspace_id","entity_type","position") WHERE "pipeline_stages"."entity_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stages_entity_position_unique" ON "pipeline_stages" USING btree ("workspace_id","entity_type","entity_id","position") WHERE "pipeline_stages"."entity_id" IS NOT NULL;