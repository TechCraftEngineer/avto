CREATE TYPE "public"."career_trajectory_type" AS ENUM('growth', 'stable', 'decline', 'jump', 'role_change');--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "potential_score" integer;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_score" integer;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_type" "career_trajectory_type";--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "hidden_fit_indicators" jsonb;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "potential_analysis" text;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_analysis" text;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "hidden_fit_analysis" text;--> statement-breakpoint
CREATE INDEX "response_screening_potential_score_idx" ON "response_screenings" USING btree ("potential_score");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_score_idx" ON "response_screenings" USING btree ("career_trajectory_score");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_type_idx" ON "response_screenings" USING btree ("career_trajectory_type");--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screening_potential_score_check" CHECK ("response_screenings"."potential_score" IS NULL OR "response_screenings"."potential_score" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screening_career_trajectory_score_check" CHECK ("response_screenings"."career_trajectory_score" IS NULL OR "response_screenings"."career_trajectory_score" BETWEEN 0 AND 100);