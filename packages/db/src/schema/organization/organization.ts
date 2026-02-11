import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Тарифные планы организации
export const organizationPlanEnum = pgEnum("organization_plan", [
  "free",
  "pro",
  "enterprise",
]);

export type OrganizationPlan = "free" | "pro" | "enterprise";

export const organization = pgTable("organizations", {
  id: text("id").primaryKey().default(sql`organization_id_generate()`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  description: text("description"),
  externalId: varchar("external_id", { length: 100 }),
  logo: text("logo"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),

  // Тарифный план организации
  plan: organizationPlanEnum("plan").default("free").notNull(),

  // Email для биллинга
  billingEmail: text("billing_email"),

  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  website: text("website"),
});

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
