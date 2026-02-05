import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  identifier: text("identifier").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  value: text("value").notNull(),
});
