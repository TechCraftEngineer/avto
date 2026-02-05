import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const integration = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    cookies:
      jsonb("cookies").$type<
        Array<{
          name: string;
          value: string;
          domain?: string;
          path?: string;
          expires?: number;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: "Strict" | "Lax" | "None";
        }>
      >(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    credentials: jsonb("credentials").notNull().$type<Record<string, string>>(),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    // Уникальное ограничение: один workspace - одна интеграция каждого типа
    workspaceTypeUnique: unique().on(table.workspaceId, table.type),
    workspaceIdx: index("integration_workspace_idx").on(table.workspaceId),
    typeIdx: index("integration_type_idx").on(table.type),
    // Partial index для активных интеграций
    activeIntegrationsIdx: index("integration_active_idx")
      .on(table.workspaceId, table.isActive)
      .where(sql`${table.isActive} = true`),
    credentialsIdx: index("integration_credentials_idx").using(
      "gin",
      table.credentials,
    ),
    metadataIdx: index("integration_metadata_idx").using("gin", table.metadata),
  }),
);

export type Integration = typeof integration.$inferSelect;
export type NewIntegration = typeof integration.$inferInsert;
