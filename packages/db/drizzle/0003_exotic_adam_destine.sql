CREATE TYPE "public"."workspace_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "plan" "workspace_plan" DEFAULT 'free' NOT NULL;