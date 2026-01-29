ALTER TABLE "vacancies" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;