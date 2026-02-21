ALTER TABLE "candidates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "candidates" CASCADE;--> statement-breakpoint
DROP INDEX "response_platform_profile_idx";--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "is_favorite" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "responses" DROP COLUMN "resume_url";--> statement-breakpoint
ALTER TABLE "responses" DROP COLUMN "platform_profile_url";--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN "views";--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN "responses";--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN "new_responses";--> statement-breakpoint
DROP TYPE "public"."candidate_source";--> statement-breakpoint
DROP TYPE "public"."candidate_status";--> statement-breakpoint
DROP TYPE "public"."english_level";--> statement-breakpoint
DROP TYPE "public"."gender";--> statement-breakpoint
DROP TYPE "public"."parsing_status";--> statement-breakpoint
DROP TYPE "public"."work_format";