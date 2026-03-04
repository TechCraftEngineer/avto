ALTER TABLE "global_candidates" ALTER COLUMN "gender" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."global_gender";--> statement-breakpoint
-- Нормализация legacy-значений: только 'male' и 'female' допустимы в новом enum
UPDATE "global_candidates" SET "gender" = NULL WHERE "gender" IS NOT NULL AND "gender" NOT IN ('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."global_gender" AS ENUM('male', 'female');--> statement-breakpoint
ALTER TABLE "global_candidates" ALTER COLUMN "gender" SET DATA TYPE "public"."global_gender" USING "gender"::"public"."global_gender";