import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { user } from "../auth";
import { response } from "./response";

/**
 * Комментарии к откликам
 */
export const responseComment = pgTable(
  "response_comments",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    isPrivate: boolean("is_private").default(true).notNull(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("response_comment_response_idx").on(table.responseId),
    index("response_comment_author_idx").on(table.authorId),
    index("response_comment_created_at_idx").on(table.createdAt),
    index("response_comment_response_created_idx").on(
      table.responseId,
      table.createdAt,
    ),
  ],
);

export const CreateResponseCommentSchema = createInsertSchema(responseComment, {
  responseId: z.uuid(),
  authorId: z.string(),
  content: z.string().min(1),
  isPrivate: z.boolean().default(true),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ResponseComment = typeof responseComment.$inferSelect;
export type NewResponseComment = typeof responseComment.$inferInsert;
