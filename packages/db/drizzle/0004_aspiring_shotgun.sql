ALTER TYPE "public"."response_event_type" ADD VALUE 'EMAIL_ADDED' BEFORE 'RESUME_UPDATED';--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "entity_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "interview_links" ALTER COLUMN "entity_id" SET DATA TYPE text;