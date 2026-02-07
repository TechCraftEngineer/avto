ALTER TABLE "vacancies" DROP CONSTRAINT "vacancies_merged_into_vacancy_id_vacancies_id_fk";
--> statement-breakpoint
ALTER TABLE "vacancies" DROP COLUMN "merged_into_vacancy_id";