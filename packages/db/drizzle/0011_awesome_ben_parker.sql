CREATE TABLE "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_integrations_user_id_type_unique" UNIQUE("user_id","type")
);
--> statement-breakpoint
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_integration_user_idx" ON "user_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_integration_type_idx" ON "user_integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_integration_active_idx" ON "user_integrations" USING btree ("user_id","is_active") WHERE "user_integrations"."is_active" = true;