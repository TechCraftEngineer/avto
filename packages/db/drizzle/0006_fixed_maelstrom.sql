ALTER TABLE "response_screenings" ADD COLUMN "psychometric_score" integer;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD COLUMN "psychometric_analysis" jsonb;--> statement-breakpoint
CREATE INDEX "response_screening_psychometric_score_idx" ON "response_screenings" USING btree ("psychometric_score");--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screening_psychometric_score_check" CHECK ("response_screenings"."psychometric_score" IS NULL OR "response_screenings"."psychometric_score" BETWEEN 0 AND 100);