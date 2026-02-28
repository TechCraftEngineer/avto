CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"entity_type" "response_entity_type" NOT NULL,
	"entity_id" uuid,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	"color" varchar(50),
	"legacy_key" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "pipeline_stage_id" uuid;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_pipeline_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("pipeline_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pipeline_stages_workspace_entity_idx" ON "pipeline_stages" USING btree ("workspace_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "pipeline_stages_workspace_entity_position_idx" ON "pipeline_stages" USING btree ("workspace_id","entity_type","entity_id","position");--> statement-breakpoint
CREATE INDEX "response_pipeline_stage_idx" ON "responses" USING btree ("pipeline_stage_id");