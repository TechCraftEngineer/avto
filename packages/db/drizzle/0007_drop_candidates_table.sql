-- Удаление таблицы candidates после миграции в global_candidates
DROP TABLE IF EXISTS "candidates" CASCADE;
--> statement-breakpoint
-- Удаление enum-типов, использовавшихся только в candidates
DROP TYPE IF EXISTS "candidate_source" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "candidate_status" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "parsing_status" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "gender" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "english_level" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "work_format" CASCADE;
