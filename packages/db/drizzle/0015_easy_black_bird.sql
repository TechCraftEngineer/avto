CREATE TYPE "public"."web_chat_link_entity_type" AS ENUM('gig', 'vacancy', 'project');--> statement-breakpoint
CREATE TABLE "web_chat_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"entity_type" "web_chat_link_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"response_id" uuid,
	"token" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "web_chat_links_token_unique" UNIQUE("token"),
	CONSTRAINT "web_chat_link_response_unique" UNIQUE("response_id"),
	CONSTRAINT "web_chat_link_entity_unique" UNIQUE("entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "web_chat_links" ADD CONSTRAINT "web_chat_links_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "web_chat_link_entity_idx" ON "web_chat_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "web_chat_link_response_idx" ON "web_chat_links" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "web_chat_link_token_idx" ON "web_chat_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "web_chat_link_active_idx" ON "web_chat_links" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "web_chat_link_expires_idx" ON "web_chat_links" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "web_chat_link_metadata_idx" ON "web_chat_links" USING gin ("metadata");