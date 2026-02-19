-- Шаг 1: Обнуляем global_candidate_id для откликов, ссылающихся на candidates
-- (старая схема). После миграции FK эти связи будут невалидны.
-- Скрипт link-responses-to-candidates можно запустить для повторного связывания.
UPDATE "responses"
SET "global_candidate_id" = NULL
WHERE "global_candidate_id" IS NOT NULL
  AND "global_candidate_id" NOT IN (SELECT "id" FROM "global_candidates");
--> statement-breakpoint
ALTER TABLE "responses" DROP CONSTRAINT "responses_global_candidate_id_candidates_id_fk";
--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_global_candidate_id_global_candidates_id_fk" FOREIGN KEY ("global_candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE set null ON UPDATE no action;