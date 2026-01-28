import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { response } from "./response";

/**
 * Теги для откликов
 */
export const responseTag = pgTable(
  "response_tags",
  {
    id: uuid("id").default(sql`uuid_generate_v7()`).notNull(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.responseId, table.tag] }),
    index("response_tag_response_idx").on(table.responseId),
    index("response_tag_tag_idx").on(table.tag),
  ],
);

export const CreateResponseTagSchema = createInsertSchema(responseTag, {
  responseId: z.string().uuid(),
  tag: z.string().min(1).max(50),
}).omit({
  id: true,
  createdAt: true,
});

export type ResponseTag = typeof responseTag.$inferSelect;
export type NewResponseTag = typeof responseTag.$inferInsert;
