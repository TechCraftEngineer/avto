CREATE TABLE "vacancy_drafts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"draft_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vacancy_drafts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "work_location" varchar(200);--> statement-breakpoint
ALTER TABLE "vacancy_drafts" ADD CONSTRAINT "vacancy_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vacancy_draft_user_id_idx" ON "vacancy_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vacancy_draft_updated_at_idx" ON "vacancy_drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "vacancy_draft_data_idx" ON "vacancy_drafts" USING gin ("draft_data");