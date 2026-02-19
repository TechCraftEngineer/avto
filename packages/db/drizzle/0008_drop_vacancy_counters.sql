-- Удаление колонок views, responses, new_responses из таблицы vacancies
-- Эти данные больше не парсятся и не хранятся — подсчёт идёт через таблицу responses
ALTER TABLE "vacancies" DROP COLUMN IF EXISTS "views";
--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN IF EXISTS "responses";
--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN IF EXISTS "new_responses";
