CREATE TABLE "response_tags" (
	"id" uuid DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_tags_response_id_tag_pk" PRIMARY KEY("response_id","tag")
);
--> statement-breakpoint
ALTER TABLE "response_tags" ADD CONSTRAINT "response_tags_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "response_tag_response_idx" ON "response_tags" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_tag_tag_idx" ON "response_tags" USING btree ("tag");