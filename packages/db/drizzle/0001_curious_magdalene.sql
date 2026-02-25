CREATE TYPE "public"."personal_chat_message_role" AS ENUM('user', 'candidate');--> statement-breakpoint
CREATE TYPE "public"."personal_chat_message_type" AS ENUM('text', 'voice');--> statement-breakpoint
CREATE TABLE "personal_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"external_id" varchar(100),
	"file_id" uuid,
	"role" "personal_chat_message_role" NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "personal_chat_message_type" DEFAULT 'text' NOT NULL,
	"voice_duration" integer,
	"voice_transcription" text
);
--> statement-breakpoint
CREATE TABLE "personal_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"global_candidate_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"metadata" jsonb,
	"telegram_chat_id" varchar(100) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_telegram_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"api_hash" text NOT NULL,
	"api_id" text NOT NULL,
	"auth_error" text,
	"auth_error_at" timestamp with time zone,
	"auth_error_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"phone" text NOT NULL,
	"session_data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_info" jsonb,
	"user_id" text NOT NULL,
	CONSTRAINT "user_telegram_sessions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "personal_chat_messages" ADD CONSTRAINT "personal_chat_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_chat_messages" ADD CONSTRAINT "personal_chat_messages_session_id_personal_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."personal_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_chat_sessions" ADD CONSTRAINT "personal_chat_sessions_global_candidate_id_global_candidates_id_fk" FOREIGN KEY ("global_candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_chat_sessions" ADD CONSTRAINT "personal_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_telegram_sessions" ADD CONSTRAINT "user_telegram_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personal_chat_message_session_idx" ON "personal_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "personal_chat_message_created_at_idx" ON "personal_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "personal_chat_session_user_candidate_idx" ON "personal_chat_sessions" USING btree ("user_id","global_candidate_id");--> statement-breakpoint
CREATE INDEX "personal_chat_session_user_chat_idx" ON "personal_chat_sessions" USING btree ("user_id","telegram_chat_id");--> statement-breakpoint
CREATE INDEX "personal_chat_session_chat_idx" ON "personal_chat_sessions" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE INDEX "user_telegram_session_user_idx" ON "user_telegram_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_telegram_session_is_active_idx" ON "user_telegram_sessions" USING btree ("is_active");