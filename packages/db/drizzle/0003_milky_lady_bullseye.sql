CREATE TYPE "public"."response_interaction_channel" AS ENUM('telegram', 'phone', 'email', 'kwork', 'in_person', 'web_chat', 'whatsapp', 'other');--> statement-breakpoint
CREATE TYPE "public"."response_interaction_source" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."response_interaction_type" AS ENUM('welcome_sent', 'message_sent', 'interview_scheduled', 'interview_started', 'interview_completed', 'offer_sent', 'rejection_sent', 'call', 'email_sent', 'meeting', 'note', 'followup_sent');--> statement-breakpoint
CREATE TABLE "response_interaction_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"interaction_type" "response_interaction_type" NOT NULL,
	"source" "response_interaction_source" NOT NULL,
	"happened_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text,
	"channel" "response_interaction_channel",
	"note" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "response_interaction_log" ADD CONSTRAINT "response_interaction_log_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_interaction_log" ADD CONSTRAINT "response_interaction_log_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "response_interaction_log_response_idx" ON "response_interaction_log" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_interaction_log_response_happened_idx" ON "response_interaction_log" USING btree ("response_id","happened_at");