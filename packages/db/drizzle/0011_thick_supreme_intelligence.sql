CREATE TABLE "meta_match_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"birth_date" timestamp with time zone NOT NULL,
	"company_birth_date" timestamp with time zone,
	"manager_birth_date" timestamp with time zone,
	"team_data" jsonb,
	"summary_metrics" jsonb NOT NULL,
	"narrative" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"disclaimer" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"consent_granted" boolean NOT NULL,
	"requested_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_candidate_id_responses_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_match_candidate_idx" ON "meta_match_reports" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "meta_match_created_at_idx" ON "meta_match_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_match_requested_by_idx" ON "meta_match_reports" USING btree ("requested_by");