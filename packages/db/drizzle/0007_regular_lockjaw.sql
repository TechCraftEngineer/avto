ALTER TABLE "responses" DROP CONSTRAINT "responses_publication_id_vacancy_publications_id_fk";
--> statement-breakpoint
ALTER TABLE "responses" DROP COLUMN "publication_id";