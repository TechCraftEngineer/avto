CREATE TABLE "meta_match_reports" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "candidate_id" uuid NOT NULL REFERENCES "responses"("id") ON DELETE CASCADE,
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
  "requested_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "meta_match_candidate_idx" ON "meta_match_reports" ("candidate_id");
CREATE INDEX "meta_match_created_at_idx" ON "meta_match_reports" ("created_at");
CREATE INDEX "meta_match_requested_by_idx" ON "meta_match_reports" ("requested_by");
