import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organization } from "../organization/organization";

// Тарифные планы
export const workspacePlanEnum = pgEnum("workspace_plan", [
  "free",
  "pro",
  "enterprise",
]);

export type WorkspacePlan = "free" | "pro" | "enterprise";

export const workspace = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey().default(sql`workspace_id_generate()`),

    // Внешний ID (для интеграций)
    externalId: varchar("external_id", { length: 100 }),

    // Организация, которой принадлежит workspace
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
      }),

    // Название workspace (компании)
    name: text("name").notNull(),

    // Уникальный slug для URL (уникален в рамках организации)
    slug: text("slug").notNull(),

    // Тарифный план
    plan: workspacePlanEnum("plan").default("free").notNull(),

    // Описание компании
    description: text("description"),

    // Сайт компании
    website: text("website"),

    // Логотип
    logo: text("logo"),

    // Кастомный домен для интервью
    customDomainId: uuid("custom_domain_id"),

    // Настройки онбординга
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    dismissedGettingStarted: boolean("dismissed_getting_started").default(
      false,
    ),
    dismissedGettingStartedAt: timestamp("dismissed_getting_started_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Уникальность slug в рамках организации
    uniqueSlugPerOrg: unique().on(table.organizationId, table.slug),
    organizationIdx: index("workspace_organization_idx").on(
      table.organizationId,
    ),
  }),
);

export type Workspace = typeof workspace.$inferSelect;
export type NewWorkspace = typeof workspace.$inferInsert;
