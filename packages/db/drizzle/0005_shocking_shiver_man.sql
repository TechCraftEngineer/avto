CREATE TYPE "public"."candidate_organization_status" AS ENUM('ACTIVE', 'BLACKLISTED', 'HIRED');--> statement-breakpoint
CREATE TYPE "public"."global_candidate_source" AS ENUM('APPLICANT', 'SOURCING', 'IMPORT', 'MANUAL', 'REFERRAL');--> statement-breakpoint
CREATE TYPE "public"."global_candidate_status" AS ENUM('ACTIVE', 'BLACKLISTED', 'HIRED', 'PASSIVE');--> statement-breakpoint
CREATE TYPE "public"."global_english_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."global_gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."global_parsing_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."global_work_format" AS ENUM('remote', 'office', 'hybrid');--> statement-breakpoint
CREATE TABLE "candidate_organizations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"status" "candidate_organization_status" DEFAULT 'ACTIVE' NOT NULL,
	"applied_at" timestamp with time zone,
	"tags" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_organization_unique" UNIQUE("candidate_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "global_candidates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"middle_name" varchar(100),
	"full_name" varchar(500) NOT NULL,
	"headline" varchar(255),
	"birth_date" timestamp with time zone,
	"gender" "global_gender",
	"citizenship" varchar(100),
	"location" varchar(200),
	"email" varchar(255),
	"phone" varchar(50),
	"telegram_username" varchar(100),
	"resume_language" varchar(10) DEFAULT 'ru',
	"photo_file_id" uuid,
	"resume_url" text,
	"profile_data" jsonb,
	"skills" jsonb,
	"experience_years" integer,
	"salary_expectations_amount" integer,
	"work_format" "global_work_format",
	"english_level" "global_english_level",
	"ready_for_relocation" boolean DEFAULT false,
	"status" "global_candidate_status" DEFAULT 'ACTIVE',
	"notes" text,
	"source" "global_candidate_source" DEFAULT 'APPLICANT' NOT NULL,
	"original_source" "platform_source" DEFAULT 'MANUAL',
	"parsing_status" "global_parsing_status" DEFAULT 'COMPLETED' NOT NULL,
	"tags" jsonb,
	"is_searchable" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_candidate_email_unique" UNIQUE("email"),
	CONSTRAINT "global_candidate_phone_unique" UNIQUE("phone"),
	CONSTRAINT "global_candidate_telegram_unique" UNIQUE("telegram_username")
);
--> statement-breakpoint
ALTER TABLE "candidate_organizations" ADD CONSTRAINT "candidate_organizations_candidate_id_global_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_organizations" ADD CONSTRAINT "candidate_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_candidates" ADD CONSTRAINT "global_candidates_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_org_candidate_org_idx" ON "candidate_organizations" USING btree ("candidate_id","organization_id");--> statement-breakpoint
CREATE INDEX "candidate_org_candidate_idx" ON "candidate_organizations" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_org_organization_idx" ON "candidate_organizations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidate_org_status_idx" ON "candidate_organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidate_org_applied_at_idx" ON "candidate_organizations" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "global_candidate_email_idx" ON "global_candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "global_candidate_phone_idx" ON "global_candidates" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "global_candidate_telegram_idx" ON "global_candidates" USING btree ("telegram_username");--> statement-breakpoint
CREATE INDEX "global_candidate_skills_idx" ON "global_candidates" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "global_candidate_profile_data_idx" ON "global_candidates" USING gin ("profile_data");--> statement-breakpoint
CREATE INDEX "global_candidate_tags_idx" ON "global_candidates" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "global_candidate_status_idx" ON "global_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "global_candidate_source_idx" ON "global_candidates" USING btree ("source");--> statement-breakpoint
CREATE INDEX "global_candidate_full_name_idx" ON "global_candidates" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "global_candidate_location_idx" ON "global_candidates" USING btree ("location");