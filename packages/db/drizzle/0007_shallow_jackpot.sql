ALTER TABLE "global_candidates" ALTER COLUMN "gender" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."global_gender";--> statement-breakpoint
CREATE TYPE "public"."global_gender" AS ENUM('male', 'female');--> statement-breakpoint
ALTER TABLE "global_candidates" ALTER COLUMN "gender" SET DATA TYPE "public"."global_gender" USING "gender"::"public"."global_gender";