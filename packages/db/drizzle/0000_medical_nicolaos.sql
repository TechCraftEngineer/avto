CREATE TYPE "public"."prequalification_analytics_event_type" AS ENUM('widget_view', 'session_start', 'resume_upload', 'dialogue_message', 'dialogue_complete', 'evaluation_complete', 'application_submit', 'web_chat_start', 'telegram_chat_start', 'communication_channel_selected');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('VIEW', 'EXPORT', 'UPDATE', 'DELETE', 'ACCESS', 'CREATE', 'EVALUATE', 'SUBMIT');--> statement-breakpoint
CREATE TYPE "public"."audit_resource_type" AS ENUM('VACANCY_RESPONSE', 'CONVERSATION', 'RESUME', 'CONTACT_INFO', 'VACANCY', 'PREQUALIFICATION_SESSION', 'WIDGET_CONFIG', 'CUSTOM_DOMAIN', 'RULE', 'CANDIDATE', 'ORGANIZATION', 'USER', 'GIG');--> statement-breakpoint
CREATE TYPE "public"."candidate_source" AS ENUM('APPLICANT', 'SOURCING', 'IMPORT', 'MANUAL', 'REFERRAL');--> statement-breakpoint
CREATE TYPE "public"."candidate_status" AS ENUM('ACTIVE', 'BLACKLISTED', 'HIRED', 'PASSIVE');--> statement-breakpoint
CREATE TYPE "public"."career_trajectory_type" AS ENUM('growth', 'stable', 'decline', 'jump', 'role_change');--> statement-breakpoint
CREATE TYPE "public"."chat_entity_type" AS ENUM('gig', 'vacancy', 'project', 'team');--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'file', 'event');--> statement-breakpoint
CREATE TYPE "public"."chat_status" AS ENUM('active', 'archived', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."domain_type" AS ENUM('interview', 'prequalification');--> statement-breakpoint
CREATE TYPE "public"."english_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."agent_feedback_type" AS ENUM('accepted', 'rejected', 'modified', 'error_report');--> statement-breakpoint
CREATE TYPE "public"."file_provider" AS ENUM('S3');--> statement-breakpoint
CREATE TYPE "public"."fit_decision" AS ENUM('strong_fit', 'potential_fit', 'not_fit');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."gig_type" AS ENUM('DEVELOPMENT', 'DESIGN', 'COPYWRITING', 'MARKETING', 'TRANSLATION', 'VIDEO', 'AUDIO', 'DATA_ENTRY', 'RESEARCH', 'CONSULTING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."honesty_level" AS ENUM('direct', 'diplomatic', 'encouraging');--> statement-breakpoint
CREATE TYPE "public"."hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'SELECTED', 'OFFER', 'SECURITY_PASSED', 'CONTRACT_SENT', 'IN_PROGRESS', 'ONBOARDING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('SINGLE', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."platform_source" AS ENUM('MANUAL', 'HH', 'AVITO', 'SUPERJOB', 'HABR', 'KWORK', 'FL_RU', 'FREELANCE_RU', 'WEB_LINK', 'TELEGRAM');--> statement-breakpoint
CREATE TYPE "public"."interview_channel" AS ENUM('web', 'telegram', 'whatsapp', 'max');--> statement-breakpoint
CREATE TYPE "public"."interview_link_entity_type" AS ENUM('gig', 'vacancy', 'project', 'response');--> statement-breakpoint
CREATE TYPE "public"."interview_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."interview_message_type" AS ENUM('text', 'voice', 'file', 'event');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('pending', 'active', 'completed', 'cancelled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."parsing_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."prequalification_source" AS ENUM('widget', 'direct');--> statement-breakpoint
CREATE TYPE "public"."prequalification_status" AS ENUM('consent_pending', 'resume_pending', 'dialogue_active', 'evaluating', 'completed', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."recommendation" AS ENUM('HIGHLY_RECOMMENDED', 'RECOMMENDED', 'NEUTRAL', 'NOT_RECOMMENDED');--> statement-breakpoint
CREATE TYPE "public"."response_entity_type" AS ENUM('gig', 'vacancy', 'project');--> statement-breakpoint
CREATE TYPE "public"."response_event_type" AS ENUM('STATUS_CHANGED', 'HR_STATUS_CHANGED', 'TELEGRAM_USERNAME_ADDED', 'CHAT_ID_ADDED', 'PHONE_ADDED', 'RESUME_UPDATED', 'PHOTO_ADDED', 'WELCOME_SENT', 'OFFER_SENT', 'COMMENT_ADDED', 'SALARY_UPDATED', 'CONTACT_INFO_UPDATED', 'CREATED', 'SCREENING_COMPLETED', 'INTERVIEW_STARTED', 'INTERVIEW_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'NEGOTIATION', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."ssl_status" AS ENUM('pending', 'active', 'error', 'expired');--> statement-breakpoint
CREATE TYPE "public"."temp_message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."temp_message_sender" AS ENUM('CANDIDATE', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."widget_tone" AS ENUM('formal', 'friendly');--> statement-breakpoint
CREATE TYPE "public"."work_format" AS ENUM('remote', 'office', 'hybrid');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action_id" uuid,
	"recommendation_id" uuid,
	"feedback_type" "agent_feedback_type" NOT NULL,
	"original_recommendation" text,
	"user_action" text,
	"reason" text,
	"rating" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_feedback_rating_check" CHECK ("agent_feedback"."rating" IS NULL OR "agent_feedback"."rating" BETWEEN 1 AND 5)
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
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"action" "audit_action" NOT NULL,
	"resource_type" "audit_resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"bot_name" text DEFAULT 'Дмитрий' NOT NULL,
	"bot_role" text DEFAULT 'рекрутер' NOT NULL,
	"company_name" text NOT NULL,
	"company_website" text,
	"company_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "buffered_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"interview_step" integer NOT NULL,
	"content" varchar(10000) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"question_context" varchar(1000),
	"timestamp" bigint NOT NULL,
	"flush_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buffered_temp_interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"temp_session_id" varchar(100) NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"sender" "temp_message_sender" NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"content" text NOT NULL,
	"external_message_id" varchar(100),
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"middle_name" varchar(100),
	"full_name" varchar(500) NOT NULL,
	"headline" varchar(255),
	"birth_date" timestamp with time zone,
	"gender" "gender",
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
	"work_format" "work_format",
	"english_level" "english_level",
	"ready_for_relocation" boolean DEFAULT false,
	"status" "candidate_status" DEFAULT 'ACTIVE',
	"notes" text,
	"source" "candidate_source" DEFAULT 'APPLICANT' NOT NULL,
	"original_source" "platform_source" DEFAULT 'MANUAL',
	"parsing_status" "parsing_status" DEFAULT 'COMPLETED' NOT NULL,
	"tags" jsonb,
	"is_searchable" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"type" "chat_message_type" DEFAULT 'text' NOT NULL,
	"content" text,
	"quick_replies" jsonb,
	"file_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"entity_type" "chat_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" text,
	"title" varchar(500),
	"status" "chat_status" DEFAULT 'active' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"provider" "file_provider" DEFAULT 'S3' NOT NULL,
	"key" text NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "gig_interview_media" (
	"gig_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gig_interview_media_gig_id_file_id_pk" PRIMARY KEY("gig_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"cookies" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_workspace_id_type_unique" UNIQUE("workspace_id","type")
);
--> statement-breakpoint
CREATE TABLE "interview_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"entity_type" "interview_link_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"token" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
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
CREATE TABLE "interview_scorings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"interview_session_id" uuid NOT NULL,
	"response_id" uuid,
	"score" integer NOT NULL,
	"rating" integer,
	"analysis" text,
	"bot_usage_detected" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorings_interview_session_id_unique" UNIQUE("interview_session_id"),
	CONSTRAINT "interview_scoring_score_check" CHECK ("interview_scorings"."score" BETWEEN 0 AND 100),
	CONSTRAINT "interview_scoring_rating_check" CHECK ("interview_scorings"."rating" IS NULL OR "interview_scorings"."rating" BETWEEN 0 AND 5),
	CONSTRAINT "interview_scoring_bot_usage_check" CHECK ("interview_scorings"."bot_usage_detected" IS NULL OR "interview_scorings"."bot_usage_detected" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"status" "interview_status" DEFAULT 'pending' NOT NULL,
	"last_channel" "interview_channel",
	"question_number" integer DEFAULT 0 NOT NULL,
	"total_questions" integer,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"metadata" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_sessions_response_id_unique" UNIQUE("response_id")
);
--> statement-breakpoint
CREATE TABLE "meta_match_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"birth_date" timestamp with time zone NOT NULL,
	"company_birth_date" timestamp with time zone,
	"manager_birth_date" timestamp with time zone,
	"team_data" jsonb,
	"summary_metrics" jsonb NOT NULL,
	"narrative" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"disclaimer" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"consent_granted" boolean NOT NULL,
	"requested_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT organization_id_generate() NOT NULL,
	"external_id" varchar(100),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_email" text,
	"invited_user_id" text,
	"created_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
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
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"entity_type" "response_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"publication_id" uuid,
	"global_candidate_id" uuid,
	"candidate_id" varchar(100) NOT NULL,
	"candidate_name" varchar(500),
	"profile_url" text,
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
	"resume_url" text,
	"platform_profile_url" text,
	"salary_expectations_amount" integer,
	"salary_expectations_comment" varchar(200),
	"cover_letter" text,
	"photo_file_id" uuid,
	"resume_pdf_file_id" uuid,
	"experience" text,
	"profile_data" jsonb,
	"skills" jsonb,
	"rating" varchar(20),
	"status" "response_status" DEFAULT 'NEW' NOT NULL,
	"hr_selection_status" "hr_selection_status",
	"import_source" "platform_source" DEFAULT 'MANUAL',
	"composite_score" integer,
	"price_score" integer,
	"delivery_score" integer,
	"skills_match_score" integer,
	"experience_score" integer,
	"price_score_reasoning" text,
	"delivery_score_reasoning" text,
	"skills_match_score_reasoning" text,
	"experience_score_reasoning" text,
	"composite_score_reasoning" text,
	"evaluation_reasoning" jsonb,
	"ranking_position" integer,
	"ranking_analysis" text,
	"candidate_summary" text,
	"strengths" jsonb,
	"weaknesses" jsonb,
	"recommendation" "recommendation",
	"ranked_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"welcome_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_entity_candidate_unique" UNIQUE("entity_type","entity_id","candidate_id"),
	CONSTRAINT "response_composite_score_check" CHECK ("responses"."composite_score" IS NULL OR "responses"."composite_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_price_score_check" CHECK ("responses"."price_score" IS NULL OR "responses"."price_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_delivery_score_check" CHECK ("responses"."delivery_score" IS NULL OR "responses"."delivery_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_skills_match_score_check" CHECK ("responses"."skills_match_score" IS NULL OR "responses"."skills_match_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_experience_score_check" CHECK ("responses"."experience_score" IS NULL OR "responses"."experience_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "response_comments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"event_type" "response_event_type" NOT NULL,
	"user_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_screenings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"potential_score" integer,
	"career_trajectory_score" integer,
	"career_trajectory_type" "career_trajectory_type",
	"hidden_fit_indicators" jsonb,
	"analysis" text,
	"price_analysis" text,
	"delivery_analysis" text,
	"skills_analysis" text,
	"experience_analysis" text,
	"potential_analysis" text,
	"career_trajectory_analysis" text,
	"hidden_fit_analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_screenings_response_id_unique" UNIQUE("response_id"),
	CONSTRAINT "response_screening_score_check" CHECK ("response_screenings"."score" BETWEEN 0 AND 5),
	CONSTRAINT "response_screening_detailed_score_check" CHECK ("response_screenings"."detailed_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_potential_score_check" CHECK ("response_screenings"."potential_score" IS NULL OR "response_screenings"."potential_score" BETWEEN 0 AND 100),
	CONSTRAINT "response_screening_career_trajectory_score_check" CHECK ("response_screenings"."career_trajectory_score" IS NULL OR "response_screenings"."career_trajectory_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "response_tags" (
	"id" uuid DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_tags_response_id_tag_pk" PRIMARY KEY("response_id","tag")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"api_id" text NOT NULL,
	"api_hash" text NOT NULL,
	"phone" text NOT NULL,
	"session_data" jsonb NOT NULL,
	"user_info" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"auth_error" text,
	"auth_error_at" timestamp with time zone,
	"auth_error_notified_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_sessions_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "temp_interview_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"temp_session_id" varchar(100) NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"sender" "temp_message_sender" NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"content" text NOT NULL,
	"external_message_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text,
	"bio" text,
	"role" text DEFAULT 'user' NOT NULL,
	"last_active_organization_id" text,
	"last_active_workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"owner_id" text,
	"created_by" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" text,
	"views" integer DEFAULT 0,
	"responses" integer DEFAULT 0,
	"new_responses" integer DEFAULT 0,
	"resumes_in_progress" integer DEFAULT 0,
	"suitable_resumes" integer DEFAULT 0,
	"region" varchar(200),
	"description" text,
	"requirements" jsonb,
	"source" "platform_source" DEFAULT 'HH' NOT NULL,
	"external_id" varchar(100),
	"merged_into_vacancy_id" uuid,
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"enabled_communication_channels" jsonb DEFAULT '{"webChat":true,"telegram":false}'::jsonb,
	"custom_domain_id" text,
	"welcome_message_templates" jsonb,
	"candidate_filters" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY DEFAULT workspace_id_generate() NOT NULL,
	"external_id" varchar(100),
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
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
	"workspace_id" text NOT NULL,
	"token" text NOT NULL,
	"invited_user_id" text,
	"invited_email" text,
	"role" text DEFAULT 'member' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_feedback" ADD CONSTRAINT "agent_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_analytics_events" ADD CONSTRAINT "prequalification_analytics_events_session_id_prequalification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."prequalification_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buffered_messages" ADD CONSTRAINT "buffered_messages_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_custom_domain_id_custom_domains_id_fk" FOREIGN KEY ("custom_domain_id") REFERENCES "public"."custom_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_interview_scenario_id_interview_scenarios_id_fk" FOREIGN KEY ("interview_scenario_id") REFERENCES "public"."interview_scenarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scenarios" ADD CONSTRAINT "interview_scenarios_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_candidate_id_responses_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_match_reports" ADD CONSTRAINT "meta_match_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_chat_session_id_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_publication_id_vacancy_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."vacancy_publications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_global_candidate_id_candidates_id_fk" FOREIGN KEY ("global_candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_portfolio_file_id_files_id_fk" FOREIGN KEY ("portfolio_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_resume_pdf_file_id_files_id_fk" FOREIGN KEY ("resume_pdf_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_comments" ADD CONSTRAINT "response_comments_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_comments" ADD CONSTRAINT "response_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_history" ADD CONSTRAINT "response_history_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_history" ADD CONSTRAINT "response_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screenings_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_tags" ADD CONSTRAINT "response_tags_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_organization_id_organizations_id_fk" FOREIGN KEY ("last_active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("last_active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_merged_into_vacancy_id_vacancies_id_fk" FOREIGN KEY ("merged_into_vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_publications" ADD CONSTRAINT "vacancy_publications_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_idx" ON "agent_feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_idx" ON "agent_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_type_idx" ON "agent_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_created_at_idx" ON "agent_feedback" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_workspace_idx" ON "agent_feedback" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_workspace_idx" ON "prequalification_analytics_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_vacancy_idx" ON "prequalification_analytics_events" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "preq_analytics_event_type_idx" ON "prequalification_analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "preq_analytics_timestamp_idx" ON "prequalification_analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "preq_analytics_workspace_timestamp_idx" ON "prequalification_analytics_events" USING btree ("workspace_id","timestamp");--> statement-breakpoint
CREATE INDEX "preq_analytics_vacancy_timestamp_idx" ON "prequalification_analytics_events" USING btree ("vacancy_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_created_at_idx" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_metadata_idx" ON "audit_logs" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "bot_settings_workspace_idx" ON "bot_settings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "buffered_message_interview_session_step_idx" ON "buffered_messages" USING btree ("interview_session_id","interview_step");--> statement-breakpoint
CREATE INDEX "buffered_message_user_idx" ON "buffered_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_id_idx" ON "buffered_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_message_timestamp_idx" ON "buffered_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_session_idx" ON "buffered_temp_interview_messages" USING btree ("temp_session_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_chat_idx" ON "buffered_temp_interview_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_id_idx" ON "buffered_temp_interview_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_interview_message_timestamp_idx" ON "buffered_temp_interview_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "candidate_org_idx" ON "candidates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidate_email_idx" ON "candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "candidate_phone_idx" ON "candidates" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "candidate_telegram_idx" ON "candidates" USING btree ("telegram_username");--> statement-breakpoint
CREATE INDEX "candidate_skills_idx" ON "candidates" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "candidate_profile_data_idx" ON "candidates" USING gin ("profile_data");--> statement-breakpoint
CREATE INDEX "candidate_tags_idx" ON "candidates" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "candidate_status_idx" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidate_source_idx" ON "candidates" USING btree ("source");--> statement-breakpoint
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
CREATE INDEX "freelance_import_vacancy_idx" ON "freelance_import_history" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "freelance_import_user_idx" ON "freelance_import_history" USING btree ("imported_by");--> statement-breakpoint
CREATE INDEX "freelance_import_platform_idx" ON "freelance_import_history" USING btree ("platform_source");--> statement-breakpoint
CREATE INDEX "freelance_import_created_idx" ON "freelance_import_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gig_workspace_idx" ON "gigs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gig_type_idx" ON "gigs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gig_active_idx" ON "gigs" USING btree ("workspace_id","is_active") WHERE "gigs"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_source_external_idx" ON "gigs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "gig_deadline_idx" ON "gigs" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "gig_requirements_idx" ON "gigs" USING gin ("requirements");--> statement-breakpoint
CREATE INDEX "gig_interview_media_gig_idx" ON "gig_interview_media" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_interview_media_file_idx" ON "gig_interview_media" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "integration_workspace_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integration_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "integration_active_idx" ON "integrations" USING btree ("workspace_id","is_active") WHERE "integrations"."is_active" = true;--> statement-breakpoint
CREATE INDEX "integration_credentials_idx" ON "integrations" USING gin ("credentials");--> statement-breakpoint
CREATE INDEX "integration_metadata_idx" ON "integrations" USING gin ("metadata");--> statement-breakpoint
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
CREATE INDEX "interview_scenario_workspace_idx" ON "interview_scenarios" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "interview_scenario_active_idx" ON "interview_scenarios" USING btree ("workspace_id","is_active") WHERE "interview_scenarios"."is_active" = true;--> statement-breakpoint
CREATE INDEX "interview_scoring_session_idx" ON "interview_scorings" USING btree ("interview_session_id");--> statement-breakpoint
CREATE INDEX "interview_scoring_response_idx" ON "interview_scorings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "interview_scoring_score_idx" ON "interview_scorings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "interview_session_response_idx" ON "interview_sessions" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "interview_session_status_idx" ON "interview_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "interview_session_last_channel_idx" ON "interview_sessions" USING btree ("last_channel");--> statement-breakpoint
CREATE INDEX "interview_session_metadata_idx" ON "interview_sessions" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "interview_session_last_message_at_idx" ON "interview_sessions" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "interview_session_status_last_message_idx" ON "interview_sessions" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX "meta_match_candidate_idx" ON "meta_match_reports" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "meta_match_created_at_idx" ON "meta_match_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meta_match_requested_by_idx" ON "meta_match_reports" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "organization_invite_organization_idx" ON "organization_invites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_token_idx" ON "organization_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_invite_expires_idx" ON "organization_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "organization_member_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_member_organization_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_member_role_idx" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "preq_session_workspace_idx" ON "prequalification_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "preq_session_vacancy_idx" ON "prequalification_sessions" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "preq_session_response_idx" ON "prequalification_sessions" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "preq_session_status_idx" ON "prequalification_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "preq_session_fit_score_idx" ON "prequalification_sessions" USING btree ("fit_score");--> statement-breakpoint
CREATE INDEX "preq_session_chat_idx" ON "prequalification_sessions" USING btree ("chat_session_id");--> statement-breakpoint
CREATE INDEX "preq_session_interview_idx" ON "prequalification_sessions" USING btree ("interview_session_id");--> statement-breakpoint
CREATE INDEX "preq_session_parsed_resume_idx" ON "prequalification_sessions" USING gin ("parsed_resume");--> statement-breakpoint
CREATE INDEX "preq_session_evaluation_idx" ON "prequalification_sessions" USING gin ("evaluation");--> statement-breakpoint
CREATE INDEX "response_global_candidate_idx" ON "responses" USING btree ("global_candidate_id");--> statement-breakpoint
CREATE INDEX "response_status_idx" ON "responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "response_hr_status_idx" ON "responses" USING btree ("hr_selection_status");--> statement-breakpoint
CREATE INDEX "response_import_source_idx" ON "responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "response_entity_status_idx" ON "responses" USING btree ("entity_type","entity_id","status");--> statement-breakpoint
CREATE INDEX "response_entity_hr_status_idx" ON "responses" USING btree ("entity_type","entity_id","hr_selection_status");--> statement-breakpoint
CREATE INDEX "response_composite_score_idx" ON "responses" USING btree ("composite_score");--> statement-breakpoint
CREATE INDEX "response_recommendation_idx" ON "responses" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "response_ranking_position_idx" ON "responses" USING btree ("ranking_position");--> statement-breakpoint
CREATE INDEX "response_candidate_idx" ON "responses" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "response_profile_url_idx" ON "responses" USING btree ("profile_url");--> statement-breakpoint
CREATE INDEX "response_platform_profile_idx" ON "responses" USING btree ("platform_profile_url");--> statement-breakpoint
CREATE INDEX "response_skills_idx" ON "responses" USING gin ("skills");--> statement-breakpoint
CREATE INDEX "response_profile_data_idx" ON "responses" USING gin ("profile_data");--> statement-breakpoint
CREATE INDEX "response_portfolio_links_idx" ON "responses" USING gin ("portfolio_links");--> statement-breakpoint
CREATE INDEX "response_strengths_idx" ON "responses" USING gin ("strengths");--> statement-breakpoint
CREATE INDEX "response_weaknesses_idx" ON "responses" USING gin ("weaknesses");--> statement-breakpoint
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
CREATE INDEX "response_screening_score_idx" ON "response_screenings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "response_screening_detailed_score_idx" ON "response_screenings" USING btree ("detailed_score");--> statement-breakpoint
CREATE INDEX "response_screening_potential_score_idx" ON "response_screenings" USING btree ("potential_score");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_score_idx" ON "response_screenings" USING btree ("career_trajectory_score");--> statement-breakpoint
CREATE INDEX "response_screening_career_trajectory_type_idx" ON "response_screenings" USING btree ("career_trajectory_type");--> statement-breakpoint
CREATE INDEX "response_tag_response_idx" ON "response_tags" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_tag_tag_idx" ON "response_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_session_workspace_idx" ON "telegram_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "telegram_session_is_active_idx" ON "telegram_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "telegram_session_data_idx" ON "telegram_sessions" USING gin ("session_data");--> statement-breakpoint
CREATE INDEX "telegram_session_user_info_idx" ON "telegram_sessions" USING gin ("user_info");--> statement-breakpoint
CREATE INDEX "temp_interview_message_session_idx" ON "temp_interview_messages" USING btree ("temp_session_id");--> statement-breakpoint
CREATE INDEX "temp_interview_message_chat_idx" ON "temp_interview_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "temp_interview_message_created_at_idx" ON "temp_interview_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vacancy_workspace_idx" ON "vacancies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "vacancy_active_idx" ON "vacancies" USING btree ("workspace_id","is_active") WHERE "vacancies"."is_active" = true;--> statement-breakpoint
CREATE INDEX "vacancy_source_external_idx" ON "vacancies" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "vacancy_requirements_idx" ON "vacancies" USING gin ("requirements");--> statement-breakpoint
CREATE INDEX "vacancy_publication_vacancy_idx" ON "vacancy_publications" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "vacancy_publication_platform_external_idx" ON "vacancy_publications" USING btree ("platform","external_id");--> statement-breakpoint
CREATE INDEX "workspace_organization_idx" ON "workspaces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_workspace_idx" ON "workspace_invites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_token_idx" ON "workspace_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "workspace_invite_expires_idx" ON "workspace_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_workspace_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_role_idx" ON "workspace_members" USING btree ("role");