CREATE TYPE "public"."payment_currency" AS ENUM('RUB');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'canceled');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"yookassa_id" text NOT NULL,
	"idempotence_key" text NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "payment_currency" DEFAULT 'RUB' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"return_url" text NOT NULL,
	"confirmation_url" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payments_yookassa_id_unique" UNIQUE("yookassa_id"),
	CONSTRAINT "payments_idempotence_key_unique" UNIQUE("idempotence_key")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_workspace_idx" ON "payments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "payment_organization_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_yookassa_idx" ON "payments" USING btree ("yookassa_id");