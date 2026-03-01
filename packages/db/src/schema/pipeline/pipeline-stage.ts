import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { responseEntityTypeEnum } from "../response/response";
import { workspace } from "../workspace/workspace";

/**
 * Этапы pipeline для канбан-досок (vacancy, gig)
 * entity_id = null — default для workspace
 * entity_id = uuid — кастомный pipeline для конкретной vacancy/gig
 */
export const pipelineStage = pgTable(
  "pipeline_stages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    entityType: responseEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id"), // null = default; иначе uuid vacancy/gig

    label: text("label").notNull(),
    position: integer("position").notNull(),
    color: varchar("color", { length: 50 }),
    legacyKey: varchar("legacy_key", { length: 50 }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pipeline_stages_workspace_entity_idx").on(
      table.workspaceId,
      table.entityType,
      table.entityId,
    ),
    uniqueIndex("pipeline_stages_default_position_unique")
      .on(table.workspaceId, table.entityType, table.position)
      .where(sql`${table.entityId} IS NULL`),
    uniqueIndex("pipeline_stages_entity_position_unique")
      .on(table.workspaceId, table.entityType, table.entityId, table.position)
      .where(sql`${table.entityId} IS NOT NULL`),
  ],
);
