ALTER TYPE "public"."response_event_type" ADD VALUE 'CANDIDATE_LINKED';--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "birth_date" timestamp with time zone;