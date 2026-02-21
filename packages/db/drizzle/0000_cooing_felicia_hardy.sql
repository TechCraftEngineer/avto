CREATE TYPE "public"."audit_action" AS ENUM('VIEW', 'EXPORT', 'UPDATE', 'DELETE', 'ACCESS', 'CREATE', 'EVALUATE', 'SUBMIT');--> statement-breakpoint
CREATE TYPE "public"."audit_resource_type" AS ENUM('VACANCY_RESPONSE', 'CONVERSATION', 'RESUME', 'CONTACT_INFO', 'VACANCY', 'PREQUALIFICATION_SESSION', 'WIDGET_CONFIG', 'CUSTOM_DOMAIN', 'RULE', 'CANDIDATE', 'ORGANIZATION', 'USER', 'GIG');--> statement-breakpoint
CREATE TYPE "public"."candidate_organization_status" AS ENUM('ACTIVE', 'BLACKLISTED', 'HIRED');--> statement-breakpoint
CREATE TYPE "public"."global_candidate_source" AS ENUM('APPLICANT', 'SOURCING', 'IMPORT', 'MANUAL', 'REFERRAL');--> statement-breakpoint
CREATE TYPE "public"."global_candidate_status" AS ENUM('ACTIVE', 'BLACKLISTED', 'HIRED', 'PASSIVE');--> statement-breakpoint
CREATE TYPE "public"."global_english_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."global_gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."global_parsing_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."global_work_format" AS ENUM('remote', 'office', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'file', 'event');--> statement-breakpoint
CREATE TYPE "public"."chat_entity_type" AS ENUM('gig', 'vacancy', 'project', 'team');--> statement-breakpoint
CREATE TYPE "public"."chat_status" AS ENUM('active', 'archived', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."domain_type" AS ENUM('interview', 'prequalification');--> statement-breakpoint
CREATE TYPE "public"."ssl_status" AS ENUM('pending', 'active', 'error', 'expired');--> statement-breakpoint
CREATE TYPE "public"."file_provider" AS ENUM('S3');--> statement-breakpoint
CREATE TYPE "public"."gig_type" AS ENUM('DEVELOPMENT', 'DESIGN', 'COPYWRITING', 'MARKETING', 'TRANSLATION', 'VIDEO', 'AUDIO', 'DATA_ENTRY', 'RESEARCH', 'CONSULTING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."interview_link_entity_type" AS ENUM('gig', 'vacancy', 'project', 'response');--> statement-breakpoint
CREATE TYPE "public"."interview_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."interview_message_type" AS ENUM('text', 'voice', 'file', 'event');--> statement-breakpoint
CREATE TYPE "public"."interview_channel" AS ENUM('web', 'telegram', 'whatsapp', 'max');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('pending', 'active', 'completed', 'cancelled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."temp_message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."temp_message_sender" AS ENUM('CANDIDATE', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."organization_plan" AS ENUM('free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."payment_currency" AS ENUM('RUB');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."prequalification_analytics_event_type" AS ENUM('widget_view', 'session_start', 'resume_upload', 'dialogue_message', 'dialogue_complete', 'evaluation_complete', 'application_submit', 'web_chat_start', 'telegram_chat_start', 'communication_channel_selected');--> statement-breakpoint
CREATE TYPE "public"."fit_decision" AS ENUM('strong_fit', 'potential_fit', 'not_fit');--> statement-breakpoint
CREATE TYPE "public"."prequalification_source" AS ENUM('widget', 'direct');--> statement-breakpoint
CREATE TYPE "public"."prequalification_status" AS ENUM('consent_pending', 'resume_pending', 'dialogue_active', 'evaluating', 'completed', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."honesty_level" AS ENUM('direct', 'diplomatic', 'encouraging');--> statement-breakpoint
CREATE TYPE "public"."widget_tone" AS ENUM('formal', 'friendly');--> statement-breakpoint
CREATE TYPE "public"."agent_feedback_type" AS ENUM('accepted', 'rejected', 'modified', 'error_report');--> statement-breakpoint
CREATE TYPE "public"."response_entity_type" AS ENUM('gig', 'vacancy', 'project');--> statement-breakpoint
CREATE TYPE "public"."response_event_type" AS ENUM('STATUS_CHANGED', 'HR_STATUS_CHANGED', 'TELEGRAM_USERNAME_ADDED', 'CHAT_ID_ADDED', 'PHONE_ADDED', 'EMAIL_ADDED', 'RESUME_UPDATED', 'PHOTO_ADDED', 'WELCOME_SENT', 'OFFER_SENT', 'COMMENT_ADDED', 'SALARY_UPDATED', 'CONTACT_INFO_UPDATED', 'CREATED', 'SCREENING_COMPLETED', 'INTERVIEW_STARTED', 'INTERVIEW_COMPLETED', 'CANDIDATE_LINKED');--> statement-breakpoint
CREATE TYPE "public"."career_trajectory_type" AS ENUM('growth', 'stable', 'decline', 'jump', 'role_change');--> statement-breakpoint
CREATE TYPE "public"."hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'SELECTED', 'OFFER', 'SECURITY_PASSED', 'CONTRACT_SENT', 'IN_PROGRESS', 'ONBOARDING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."platform_source" AS ENUM('MANUAL', 'HH', 'AVITO', 'SUPERJOB', 'HABR', 'KWORK', 'FL_RU', 'FREELANCE_RU', 'WEB_LINK', 'TELEGRAM');--> statement-breakpoint
CREATE TYPE "public"."recommendation" AS ENUM('HIGHLY_RECOMMENDED', 'RECOMMENDED', 'NEUTRAL', 'NOT_RECOMMENDED');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'NEGOTIATION', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('SINGLE', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."workspace_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"action" "audit_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"metadata" jsonb,
	"resource_id" text NOT NULL,
	"resource_type" "audit_resource_type" NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	"workspace_id" text
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text,
	"access_token_expires_at" timestamp with time zone,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"updated_at" timestamp with time zone NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"last_active_organization_id" text,
	"last_active_workspace_id" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_organizations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"status" "candidate_organization_status" DEFAULT 'ACTIVE' NOT NULL,
	"applied_at" timestamp with time zone,
	"tags" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_organization_unique" UNIQUE("candidate_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "global_candidates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"middle_name" varchar(100),
	"full_name" varchar(500) NOT NULL,
	"headline" varchar(255),
	"birth_date" timestamp with time zone,
	"gender" "global_gender",
	"citizenship" varchar(100),
	"location" varchar(200),
	"email" varchar(255),
	"phone" varchar(50),
	"telegram_username" varchar(100),
	"resume_language" varchar(10) DEFAULT 'ru',
	"photo_file_id" uuid,
	"resume_url" text,
	"profile_data" jsonb,
	"skills" jsonb,
	"experience_years" integer,
	"salary_expectations_amount" integer,
	"work_format" "global_work_format",
	"english_level" "global_english_level",
	"ready_for_relocation" boolean DEFAULT false,
	"status" "global_candidate_status" DEFAULT 'ACTIVE',
	"notes" text,
	"source" "global_candidate_source" DEFAULT 'APPLICANT' NOT NULL,
	"original_source" "platform_source" DEFAULT 'MANUAL',
	"parsing_status" "global_parsing_status" DEFAULT 'COMPLETED' NOT NULL,
	"tags" jsonb,
	"is_searchable" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_candidate_email_unique" UNIQUE("email"),
	CONSTRAINT "global_candidate_phone_unique" UNIQUE("phone"),
	CONSTRAINT "global_candidate_telegram_unique" UNIQUE("telegram_username")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_id" uuid,
	"metadata" jsonb,
	"quick_replies" jsonb,
	"role" "chat_message_role" NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "chat_message_type" DEFAULT 'text' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "chat_entity_type" NOT NULL,
	"last_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"status" "chat_status" DEFAULT 'active' NOT NULL,
	"title" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	CONSTRAINT "chat_session_entity_user_unique" UNIQUE("entity_type","entity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "custom_domains" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text,
	"domain" varchar(255) NOT NULL,
	"type" "domain_type" DEFAULT 'interview' NOT NULL,
	"cname_target" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_preset" boolean DEFAULT false NOT NULL,
	"verification_error" text,
	"last_verification_attempt" timestamp with time zone,
	"ssl_status" "ssl_status" DEFAULT 'pending' NOT NULL,
	"ssl_certificate_id" varchar(255),
	"ssl_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_size" varchar(50),
	"key" text NOT NULL,
	"metadata" jsonb,
	"mime_type" varchar(100) NOT NULL,
	"provider" "file_provider" DEFAULT 'S3' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gigs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"requirements" jsonb,
	"type" "gig_type" DEFAULT 'OTHER' NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"deadline" timestamp with time zone,
	"estimated_duration" varchar(100),
	"source" "platform_source" DEFAULT 'MANUAL' NOT NULL,
	"external_id" varchar(100),
	"url" text,
	"views" integer DEFAULT 0,
	"responses" integer DEFAULT 0,
	"new_responses" integer DEFAULT 0,
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"invitation_template" text,
	"custom_domain_id" uuid,
	"interview_scenario_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_interview_media" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_id" uuid NOT NULL,
	"gig_id" uuid NOT NULL,
	CONSTRAINT "gig_interview_media_gig_id_file_id_pk" PRIMARY KEY("gig_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"cookies" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"credentials" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"metadata" jsonb,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "integrations_workspace_id_type_unique" UNIQUE("workspace_id","type")
);
--> statement-breakpoint
CREATE TABLE "buffered_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"content" varchar(10000) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flush_id" varchar(100),
	"interview_session_id" uuid NOT NULL,
	"interview_step" integer NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"question_context" varchar(1000),
	"timestamp" bigint NOT NULL,
	"user_id" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buffered_temp_interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"external_message_id" varchar(100),
	"message_id" varchar(100) NOT NULL,
	"sender" "temp_message_sender" NOT NULL,
	"temp_session_id" varchar(100) NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "interview_link_entity_type" NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"token" varchar(100) NOT NULL,
	CONSTRAINT "interview_links_token_unique" UNIQUE("token"),
	CONSTRAINT "interview_link_entity_unique" UNIQUE("entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "interview_message_role" NOT NULL,
	"type" "interview_message_type" DEFAULT 'text' NOT NULL,
	"channel" "interview_channel" DEFAULT 'web' NOT NULL,
	"content" text,
	"file_id" uuid,
	"voice_duration" integer,
	"voice_transcription" text,
	"external_id" varchar(100),
	"quick_replies" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_channel" "interview_channel",
	"last_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"question_number" integer DEFAULT 0 NOT NULL,
	"response_id" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"status" "interview_status" DEFAULT 'pending' NOT NULL,
	"total_questions" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_sessions_response_id_unique" UNIQUE("response_id")
);
--> statement-breakpoint
CREATE TABLE "interview_scorings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"analysis" text,
	"bot_usage_detected" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"rating" integer,
	"response_id" uuid,
	"score" integer NOT NULL,
	CONSTRAINT "interview_scorings_interview_session_id_unique" UNIQUE("interview_session_id"),
	CONSTRAINT "interview_scoring_score_check" CHECK ("interview_scorings"."score" BETWEEN 0 AND 100),
	CONSTRAINT "interview_scoring_rating_check" CHECK ("interview_scorings"."rating" IS NULL OR "interview_scorings"."rating" BETWEEN 0 AND 5),
	CONSTRAINT "interview_scoring_bot_usage_check" CHECK ("interview_scorings"."bot_usage_detected" IS NULL OR "interview_scorings"."bot_usage_detected" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "temp_interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"external_message_id" varchar(100),
	"sender" "temp_message_sender" NOT NULL,
	"temp_session_id" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_match_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"algorithm_version" text NOT NULL,
	"birth_date" timestamp with time zone NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company_birth_date" timestamp with time zone,
	"consent_granted" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disclaimer" text NOT NULL,
	"manager_birth_date" timestamp with time zone,
	"narrative" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"requested_by" text NOT NULL,
	"summary_metrics" jsonb NOT NULL,
	"team_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT organization_id_generate() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"external_id" varchar(100),
	"logo" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "organization_plan" DEFAULT 'free' NOT NULL,
	"billing_email" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"website" text,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_email" text,
	"invited_user_id" text,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "organization_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"yookassa_id" text NOT NULL,
	"idempotence_key" text NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "payment_currency" DEFAULT 'RUB' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"return_url" text NOT NULL,
	"confirmation_url" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payments_yookassa_id_unique" UNIQUE("yookassa_id"),
	CONSTRAINT "payments_idempotence_key_unique" UNIQUE("idempotence_key")
);
--> statement-breakpoint
CREATE TABLE "prequalification_analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"vacancy_id" uuid,
	"session_id" uuid,
	"event_type" "prequalification_analytics_event_type" NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prequalification_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"response_id" uuid,
	"chat_session_id" uuid,
	"interview_session_id" uuid,
	"status" "prequalification_status" DEFAULT 'consent_pending' NOT NULL,
	"source" "prequalification_source" DEFAULT 'widget' NOT NULL,
	"parsed_resume" jsonb,
	"fit_score" integer,
	"fit_decision" "fit_decision",
	"evaluation" jsonb,
	"candidate_feedback" text,
	"consent_given_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" varchar(45),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preq_session_fit_score_check" CHECK ("prequalification_sessions"."fit_score" IS NULL OR "prequalification_sessions"."fit_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "widget_configs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"logo" text,
	"primary_color" varchar(7) DEFAULT '#3B82F6',
	"secondary_color" varchar(7) DEFAULT '#1E40AF',
	"background_color" varchar(7) DEFAULT '#FFFFFF',
	"text_color" varchar(7) DEFAULT '#1F2937',
	"font_family" varchar(100) DEFAULT 'Inter',
	"assistant_name" varchar(100) DEFAULT 'ИИ Ассистент',
	"assistant_avatar" text,
	"welcome_message" text,
	"completion_message" text,
	"pass_threshold" integer DEFAULT 60,
	"mandatory_questions" jsonb DEFAULT '[]'::jsonb,
	"tone" "widget_tone" DEFAULT 'friendly',
	"honesty_level" "honesty_level" DEFAULT 'diplomatic',
	"max_dialogue_turns" integer DEFAULT 10,
	"session_timeout_minutes" integer DEFAULT 30,
	"consent_text" text,
	"disclaimer_text" text,
	"privacy_policy_url" text,
	"data_retention_days" integer DEFAULT 90,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "widget_configs_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"action_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"feedback_type" "agent_feedback_type" NOT NULL,
	"metadata" jsonb,
	"original_recommendation" text,
	"rating" integer,
	"reason" text,
	"recommendation_id" uuid,
	"user_action" text,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "agent_feedback_rating_check" CHECK ("agent_feedback"."rating" IS NULL OR "agent_feedback"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"entity_type" "response_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"global_candidate_id" uuid,
	"candidate_id" varchar(100) NOT NULL,
	"candidate_name" varchar(500),
	"profile_url" text,
	"birth_date" timestamp with time zone,
	"telegram_username" varchar(100),
	"chat_id" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"contacts" jsonb,
	"resume_language" varchar(10) DEFAULT 'ru',
	"telegram_pin_code" varchar(4),
	"proposed_price" integer,
	"proposed_delivery_days" integer,
	"portfolio_links" jsonb,
	"portfolio_file_id" uuid,
	"resume_id" varchar(100),
	"salary_expectations_amount" integer,
	"salary_expectations_comment" varchar(200),
	"cover_letter" text,
	"photo_file_id" uuid,
	"resume_pdf_file_id" uuid,
	"profile_data" jsonb,
	"skills" jsonb,
	"rating" varchar(20),
	"status" "response_status" DEFAULT 'NEW' NOT NULL,
	"hr_selection_status" "hr_selection_status",
	"import_source" "platform_source" DEFAULT 'MANUAL',
	"responded_at" timestamp with time zone,
	"welcome_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_entity_candidate_unique" UNIQUE("entity_type","entity_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "response_comments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"response_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" "response_event_type" NOT NULL,
	"metadata" jsonb,
	"new_value" jsonb,
	"old_value" jsonb,
	"response_id" uuid NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "response_screenings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"candidate_summary" text,
	"career_trajectory_analysis" text,
	"career_trajectory_score" integer,
	"career_trajectory_type" "career_trajectory_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivery_analysis" text,
	"delivery_score" integer,
	"experience_analysis" text,
	"experience_score" integer,
	"hidden_fit_analysis" text,
	"hidden_fit_indicators" jsonb,
	"overall_analysis" text,
	"overall_score" integer NOT NULL,
	"potential_analysis" text,
	"potential_score" integer,
	"price_analysis" text,
	"price_score" integer,
	"psychometric_analysis" jsonb,
	"psychometric_score" integer,
	"ranking_analysis" text,
	"ranking_position" integer,
	"recommendation" "recommendation",
	"response_id" uuid NOT NULL,
	"screened_at" timestamp with time zone,
	"skills_analysis" text,
	"skills_match_score" integer,
	"strengths" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"weaknesses" jsonb,
	CONSTRAINT "response_screenings_response_id_unique" UNIQUE("response_id"),
	CONSTRAINT "response_screening_overall_score_check" CHECK ("response_screenings"."overall_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_skills_score_check" CHECK ("response_screenings"."skills_match_score" IS NULL OR "response_screenings"."skills_match_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_experience_score_check" CHECK ("response_screenings"."experience_score" IS NULL OR "response_screenings"."experience_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_price_score_check" CHECK ("response_screenings"."price_score" IS NULL OR "response_screenings"."price_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_delivery_score_check" CHECK ("response_screenings"."delivery_score" IS NULL OR "response_screenings"."delivery_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_potential_score_check" CHECK ("response_screenings"."potential_score" IS NULL OR "response_screenings"."potential_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_career_trajectory_score_check" CHECK ("response_screenings"."career_trajectory_score" IS NULL OR "response_screenings"."career_trajectory_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_psychometric_score_check" CHECK ("response_screenings"."psychometric_score" IS NULL OR "response_screenings"."psychometric_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "response_tags" (
	"id" uuid DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	CONSTRAINT "response_tags_response_id_tag_pk" PRIMARY KEY("response_id","tag")
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
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
	"workspace_id" text NOT NULL,
	CONSTRAINT "telegram_sessions_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_integrations_user_id_type_unique" UNIQUE("user_id","type")
);
--> statement-breakpoint
CREATE TABLE "freelance_import_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"imported_by" text NOT NULL,
	"import_mode" "import_mode" NOT NULL,
	"platform_source" varchar(50) NOT NULL,
	"raw_text" text,
	"parsed_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"owner_id" text,
	"created_by" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" text,
	"resumes_in_progress" integer DEFAULT 0,
	"suitable_resumes" integer DEFAULT 0,
	"region" varchar(200),
	"work_location" varchar(200),
	"description" text,
	"requirements" jsonb,
	"source" "platform_source" DEFAULT 'HH' NOT NULL,
	"external_id" varchar(100),
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"enabled_communication_channels" jsonb DEFAULT '{"webChat":true,"telegram":false}'::jsonb,
	"custom_domain_id" text,
	"welcome_message_templates" jsonb,
	"candidate_filters" jsonb,
	"is_active" boolean DEFAULT true,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_drafts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"draft_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vacancy_drafts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vacancy_publications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"platform" "platform_source" NOT NULL,
	"external_id" varchar(100),
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"bot_name" text DEFAULT 'Дмитрий' NOT NULL,
	"bot_role" text DEFAULT 'рекрутер' NOT NULL,
	"company_description" text,
	"company_name" text NOT NULL,
	"company_website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "bot_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY DEFAULT workspace_id_generate() NOT NULL,
	"external_id" varchar(100),
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "workspace_plan" DEFAULT 'free' NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"custom_domain_id" uuid,
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_completed_at" timestamp with time zone,
	"dismissed_getting_started" boolean DEFAULT false,
	"dismissed_getting_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_email" text,
	"invited_user_id" text,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "workspace_members_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_organization_id_organizations_id_fk" FOREIGN KEY ("last_active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("last_active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_organizations" ADD CONSTRAINT "candidate_organizations_candidate_id_global_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_organizations" ADD CONSTRAINT "candidate_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_candidates" ADD CONSTRAINT "global_candidates_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_custom_domain_id_custom_domains_id_fk" FOREIGN KEY ("custom_domain_id") REFERENCES "public"."custom_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_interview_scenario_id_interview_scenarios_id_fk" FOREIGN KEY ("interview_scenario_id") REFERENCES "public"."interview_scenarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scenarios" ADD CONSTRAINT "interview_scenarios_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buffered_messages" ADD CONSTRAINT "buffered_messages_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_candidate_id_responses_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_session_id_prequalification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."prequalification_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_global_candidate_id_global_candidates_id_fk" FOREIGN KEY ("global_candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_portfolio_file_id_files_id_fk" FOREIGN KEY ("portfolio_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_resume_pdf_file_id_files_id_fk" FOREIGN KEY ("resume_pdf_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_comments" ADD CONSTRAINT "response_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_comments" ADD CONSTRAINT "response_comments_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_history" ADD CONSTRAINT "response_history_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_history" ADD CONSTRAINT "response_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screenings_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_tags" ADD CONSTRAINT "response_tags_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_drafts" ADD CONSTRAINT "vacancy_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_publications" ADD CONSTRAINT "vacancy_publications_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_created_at_idx" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_metadata_idx" ON "audit_logs" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "candidate_org_candidate_org_idx" ON "candidate_organizations" USING btree ("candidate_id","organization_id");--> statement-breakpoint
CREATE INDEX "candidate_org_candidate_idx" ON "candidate_organizations" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidate_org_organization_idx" ON "candidate_organizations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidate_org_status_idx" ON "candidate_organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidate_org_applied_at_idx" ON "candidate_organizations" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "global_candidate_email_idx" ON "global_candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "global_candidate_phone_idx" ON "global_candidates" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "global_candidate_telegram_idx" ON "global_candidates" USING btree ("telegram_username");--> statement-breakpoint
CREATE INDEX "global_candidate_skills_idx" ON "global_candidates" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "global_candidate_profile_data_idx" ON "global_candidates" USING gin ("profile_data");--> statement-breakpoint
CREATE INDEX "global_candidate_tags_idx" ON "global_candidates" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "global_candidate_status_idx" ON "global_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "global_candidate_source_idx" ON "global_candidates" USING btree ("source");--> statement-breakpoint
CREATE INDEX "global_candidate_full_name_idx" ON "global_candidates" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "global_candidate_location_idx" ON "global_candidates" USING btree ("location");--> statement-breakpoint
CREATE INDEX "chat_message_session_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_message_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_message_user_idx" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_message_role_idx" ON "chat_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "chat_message_type_idx" ON "chat_messages" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_message_metadata_idx" ON "chat_messages" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "chat_message_quick_replies_idx" ON "chat_messages" USING gin ("quick_replies");--> statement-breakpoint
CREATE INDEX "chat_session_entity_type_idx" ON "chat_sessions" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "chat_session_entity_idx" ON "chat_sessions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "chat_session_user_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_session_entity_user_idx" ON "chat_sessions" USING btree ("entity_type","entity_id","user_id");--> statement-breakpoint
CREATE INDEX "chat_session_status_idx" ON "chat_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_session_last_message_at_idx" ON "chat_sessions" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "chat_session_metadata_idx" ON "chat_sessions" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "custom_domain_workspace_idx" ON "custom_domains" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "custom_domain_domain_idx" ON "custom_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "custom_domain_type_idx" ON "custom_domains" USING btree ("type");--> statement-breakpoint
CREATE INDEX "custom_domain_preset_idx" ON "custom_domains" USING btree ("is_preset","type") WHERE "custom_domains"."is_preset" = true;--> statement-breakpoint
CREATE INDEX "custom_domain_primary_idx" ON "custom_domains" USING btree ("workspace_id","type","is_primary") WHERE "custom_domains"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "custom_domain_unique_domain_type" ON "custom_domains" USING btree ("domain","type");--> statement-breakpoint
CREATE INDEX "file_key_idx" ON "files" USING btree ("key");--> statement-breakpoint
CREATE INDEX "file_provider_key_idx" ON "files" USING btree ("provider","key");--> statement-breakpoint
CREATE INDEX "gig_workspace_idx" ON "gigs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gig_type_idx" ON "gigs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gig_active_idx" ON "gigs" USING btree ("workspace_id","is_active") WHERE "gigs"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_source_external_idx" ON "gigs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "gig_deadline_idx" ON "gigs" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "gig_requirements_idx" ON "gigs" USING gin ("requirements");--> statement-breakpoint
CREATE INDEX "interview_scenario_workspace_idx" ON "interview_scenarios" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "interview_scenario_active_idx" ON "interview_scenarios" USING btree ("workspace_id","is_active") WHERE "interview_scenarios"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_interview_media_gig_idx" ON "gig_interview_media" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_interview_media_file_idx" ON "gig_interview_media" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "integration_workspace_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integration_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "integration_active_idx" ON "integrations" USING btree ("workspace_id","is_active") WHERE "integrations"."is_active" = true;--> statement-breakpoint
CREATE INDEX "integration_credentials_idx" ON "integrations" USING gin ("credentials");--> statement-breakpoint
CREATE INDEX "integration_metadata_idx" ON "integrations" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "buffered_message_interview_session_step_idx" ON "buffered_messages" USING btree ("interview_session_id","interview_step");--> statement-breakpoint
CREATE INDEX "buffered_message_user_idx" ON "buffered_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_id_idx" ON "buffered_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_message_timestamp_idx" ON "buffered_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_session_idx" ON "buffered_temp_interview_messages" USING btree ("temp_session_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_chat_idx" ON "buffered_temp_interview_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_id_idx" ON "buffered_temp_interview_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_timestamp_idx" ON "buffered_temp_interview_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "interview_link_entity_idx" ON "interview_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "interview_link_token_idx" ON "interview_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "interview_link_active_idx" ON "interview_links" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "interview_link_expires_idx" ON "interview_links" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "interview_message_session_idx" ON "interview_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "interview_message_session_created_idx" ON "interview_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "interview_message_external_id_idx" ON "interview_messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "interview_message_channel_idx" ON "interview_messages" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "interview_message_metadata_idx" ON "interview_messages" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "interview_message_quick_replies_idx" ON "interview_messages" USING gin ("quick_replies");--> statement-breakpoint
CREATE INDEX "interview_session_response_idx" ON "interview_sessions" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "interview_session_status_idx" ON "interview_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "interview_session_last_channel_idx" ON "interview_sessions" USING btree ("last_channel");--> statement-breakpoint
CREATE INDEX "interview_session_metadata_idx" ON "interview_sessions" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "interview_session_last_message_at_idx" ON "interview_sessions" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "interview_session_status_last_message_idx" ON "interview_sessions" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX "interview_scoring_session_idx" ON "interview_scorings" USING btree ("interview_session_id");--> statement-breakpoint
CREATE INDEX "interview_scoring_response_idx" ON "interview_scorings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "interview_scoring_score_idx" ON "interview_scorings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "temp_interview_message_session_idx" ON "temp_interview_messages" USING btree ("temp_session_id");--> statement-breakpoint
CREATE INDEX "temp_interview_message_chat_idx" ON "temp_interview_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "temp_interview_message_created_at_idx" ON "temp_interview_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_match_candidate_idx" ON "meta_match_reports" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "meta_match_created_at_idx" ON "meta_match_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_match_requested_by_idx" ON "meta_match_reports" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "organization_invite_organization_idx" ON "organization_invites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_token_idx" ON "organization_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_invite_expires_idx" ON "organization_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "organization_member_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_member_organization_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_member_role_idx" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "payment_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_workspace_idx" ON "payments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "payment_organization_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_yookassa_idx" ON "payments" USING btree ("yookassa_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_workspace_idx" ON "prequalification_analytics_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_vacancy_idx" ON "prequalification_analytics_events" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_event_type_idx" ON "prequalification_analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "preq_analytics_timestamp_idx" ON "prequalification_analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "preq_analytics_workspace_timestamp_idx" ON "prequalification_analytics_events" USING btree ("workspace_id","timestamp");--> statement-breakpoint
CREATE INDEX "preq_analytics_vacancy_timestamp_idx" ON "prequalification_analytics_events" USING btree ("vacancy_id","timestamp");--> statement-breakpoint
CREATE INDEX "preq_session_workspace_idx" ON "prequalification_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "preq_session_vacancy_idx" ON "prequalification_sessions" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "preq_session_response_idx" ON "prequalification_sessions" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "preq_session_status_idx" ON "prequalification_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "preq_session_fit_score_idx" ON "prequalification_sessions" USING btree ("fit_score");--> statement-breakpoint
CREATE INDEX "preq_session_chat_idx" ON "prequalification_sessions" USING btree ("chat_session_id");--> statement-breakpoint
CREATE INDEX "preq_session_interview_idx" ON "prequalification_sessions" USING btree ("interview_session_id");--> statement-breakpoint
CREATE INDEX "preq_session_parsed_resume_idx" ON "prequalification_sessions" USING gin ("parsed_resume");--> statement-breakpoint
CREATE INDEX "preq_session_evaluation_idx" ON "prequalification_sessions" USING gin ("evaluation");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_idx" ON "agent_feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_idx" ON "agent_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_type_idx" ON "agent_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_created_at_idx" ON "agent_feedback" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_workspace_idx" ON "agent_feedback" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "response_global_candidate_idx" ON "responses" USING btree ("global_candidate_id");--> statement-breakpoint
CREATE INDEX "response_status_idx" ON "responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "response_hr_status_idx" ON "responses" USING btree ("hr_selection_status");--> statement-breakpoint
CREATE INDEX "response_import_source_idx" ON "responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "response_entity_status_idx" ON "responses" USING btree ("entity_type","entity_id","status");--> statement-breakpoint
CREATE INDEX "response_entity_hr_status_idx" ON "responses" USING btree ("entity_type","entity_id","hr_selection_status");--> statement-breakpoint
CREATE INDEX "response_candidate_idx" ON "responses" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "response_profile_url_idx" ON "responses" USING btree ("profile_url");--> statement-breakpoint
CREATE INDEX "response_skills_idx" ON "responses" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "response_profile_data_idx" ON "responses" USING gin ("profile_data");--> statement-breakpoint
CREATE INDEX "response_portfolio_links_idx" ON "responses" USING gin ("portfolio_links");--> statement-breakpoint
CREATE INDEX "response_contacts_idx" ON "responses" USING gin ("contacts");--> statement-breakpoint
CREATE INDEX "response_comment_response_idx" ON "response_comments" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_comment_author_idx" ON "response_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "response_comment_created_at_idx" ON "response_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "response_comment_response_created_idx" ON "response_comments" USING btree ("response_id","created_at");--> statement-breakpoint
CREATE INDEX "response_history_response_idx" ON "response_history" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_history_event_type_idx" ON "response_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "response_history_user_idx" ON "response_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "response_history_created_at_idx" ON "response_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "response_history_response_created_idx" ON "response_history" USING btree ("response_id","created_at");--> statement-breakpoint
CREATE INDEX "response_screening_response_idx" ON "response_screenings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_screening_overall_score_idx" ON "response_screenings" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "response_screening_skills_score_idx" ON "response_screenings" USING btree ("skills_match_score");--> statement-breakpoint
CREATE INDEX "response_screening_experience_score_idx" ON "response_screenings" USING btree ("experience_score");--> statement-breakpoint
CREATE INDEX "response_screening_potential_score_idx" ON "response_screenings" USING btree ("potential_score");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_score_idx" ON "response_screenings" USING btree ("career_trajectory_score");--> statement-breakpoint
CREATE INDEX "response_screening_psychometric_score_idx" ON "response_screenings" USING btree ("psychometric_score");--> statement-breakpoint
CREATE INDEX "response_screening_recommendation_idx" ON "response_screenings" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "response_screening_ranking_position_idx" ON "response_screenings" USING btree ("ranking_position");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_type_idx" ON "response_screenings" USING btree ("career_trajectory_type");--> statement-breakpoint
CREATE INDEX "response_tag_response_idx" ON "response_tags" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_tag_tag_idx" ON "response_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "telegram_session_workspace_idx" ON "telegram_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "telegram_session_is_active_idx" ON "telegram_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "telegram_session_data_idx" ON "telegram_sessions" USING gin ("session_data");--> statement-breakpoint
CREATE INDEX "telegram_session_user_info_idx" ON "telegram_sessions" USING gin ("user_info");--> statement-breakpoint
CREATE INDEX "user_integration_user_idx" ON "user_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_integration_type_idx" ON "user_integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_integration_active_idx" ON "user_integrations" USING btree ("user_id","is_active") WHERE "user_integrations"."is_active" = true;--> statement-breakpoint
CREATE INDEX "freelance_import_vacancy_idx" ON "freelance_import_history" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "freelance_import_user_idx" ON "freelance_import_history" USING btree ("imported_by");--> statement-breakpoint
CREATE INDEX "freelance_import_platform_idx" ON "freelance_import_history" USING btree ("platform_source");--> statement-breakpoint
CREATE INDEX "freelance_import_created_idx" ON "freelance_import_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vacancy_workspace_idx" ON "vacancies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "vacancy_active_idx" ON "vacancies" USING btree ("workspace_id","is_active") WHERE "vacancies"."is_active" = true;--> statement-breakpoint
CREATE INDEX "vacancy_source_external_idx" ON "vacancies" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "vacancy_requirements_idx" ON "vacancies" USING gin ("requirements");--> statement-breakpoint
CREATE INDEX "vacancy_draft_user_id_idx" ON "vacancy_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vacancy_draft_updated_at_idx" ON "vacancy_drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "vacancy_draft_data_idx" ON "vacancy_drafts" USING gin ("draft_data");--> statement-breakpoint
CREATE INDEX "vacancy_publication_vacancy_idx" ON "vacancy_publications" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "vacancy_publication_platform_external_idx" ON "vacancy_publications" USING btree ("platform","external_id");--> statement-breakpoint
CREATE INDEX "bot_settings_workspace_idx" ON "bot_settings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_organization_idx" ON "workspaces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_workspace_idx" ON "workspace_invites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_token_idx" ON "workspace_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "workspace_invite_expires_idx" ON "workspace_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_workspace_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_role_idx" ON "workspace_members" USING btree ("role");