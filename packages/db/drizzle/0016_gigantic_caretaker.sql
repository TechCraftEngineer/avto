ALTER TABLE "vacancies" ADD COLUMN "custom_domain_id" text;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "candidate_filters" jsonb;