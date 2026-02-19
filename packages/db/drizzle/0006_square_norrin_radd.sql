-- Шаг 1: Перед применением этой миграции выполните скрипт миграции данных:
--   bun run packages/db/src/scripts/migrate-candidates-to-global.ts
--
-- Шаг 2: Замена FK responses: candidates -> global_candidates
ALTER TABLE "responses" DROP CONSTRAINT "responses_global_candidate_id_candidates_id_fk";
--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_global_candidate_id_global_candidates_id_fk" FOREIGN KEY ("global_candidate_id") REFERENCES "public"."global_candidates"("id") ON DELETE set null ON UPDATE no action;