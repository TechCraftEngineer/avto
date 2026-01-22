-- Add new columns for candidate potential evaluation
ALTER TABLE "response_screenings" ADD COLUMN "potential_score" integer;
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_score" integer;
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_type" "career_trajectory_type";
ALTER TABLE "response_screenings" ADD COLUMN "hidden_fit_indicators" jsonb;
ALTER TABLE "response_screenings" ADD COLUMN "potential_analysis" text;
ALTER TABLE "response_screenings" ADD COLUMN "career_trajectory_analysis" text;
ALTER TABLE "response_screenings" ADD COLUMN "hidden_fit_analysis" text;

-- Add constraints for score ranges
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screening_potential_score_check" CHECK ("potential_score" IS NULL OR "potential_score" BETWEEN 0 AND 100);
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screening_career_trajectory_score_check" CHECK ("career_trajectory_score" IS NULL OR "career_trajectory_score" BETWEEN 0 AND 100);

-- Add indexes for sorting and filtering
CREATE INDEX "response_screening_potential_score_idx" ON "response_screenings" ("potential_score");
CREATE INDEX "response_screening_career_trajectory_score_idx" ON "response_screenings" ("career_trajectory_score");
CREATE INDEX "response_screening_career_trajectory_type_idx" ON "response_screenings" ("career_trajectory_type");
