-- Консолидация URL полей responses: оставляем только profile_url
-- Миграция данных из resume_url и platform_profile_url в profile_url
UPDATE "responses"
SET "profile_url" = COALESCE("resume_url", "platform_profile_url", "profile_url")
WHERE "profile_url" IS NULL OR "profile_url" = '';
--> statement-breakpoint
DROP INDEX IF EXISTS "response_platform_profile_idx";
--> statement-breakpoint
ALTER TABLE "responses" DROP COLUMN IF EXISTS "resume_url";
--> statement-breakpoint
ALTER TABLE "responses" DROP COLUMN IF EXISTS "platform_profile_url";
