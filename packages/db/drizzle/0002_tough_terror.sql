CREATE TABLE "response_scheduled_interviews" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"calendar_event_id" varchar(255),
	"calendar_event_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_scheduled_interviews_response_id_unique" UNIQUE("response_id"),
	CONSTRAINT "response_scheduled_interview_duration_check" CHECK ("response_scheduled_interviews"."duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "response_scheduled_interviews" ADD CONSTRAINT "response_scheduled_interviews_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;