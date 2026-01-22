ALTER TABLE "responses" ADD COLUMN "price_score_reasoning" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "delivery_score_reasoning" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "skills_match_score_reasoning" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "experience_score_reasoning" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "composite_score_reasoning" text;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "evaluation_reasoning" jsonb;