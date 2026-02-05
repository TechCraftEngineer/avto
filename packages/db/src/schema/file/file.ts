import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fileProviderEnum = pgEnum("file_provider", ["S3"]);

export const file = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    fileName: varchar("file_name", { length: 500 }).notNull(),
    fileSize: varchar("file_size", { length: 50 }),
    key: text("key").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    provider: fileProviderEnum("provider").default("S3").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    keyIdx: index("file_key_idx").on(table.key),
    providerKeyIdx: index("file_provider_key_idx").on(
      table.provider,
      table.key,
    ),
  }),
);

export const CreateFileSchema = createInsertSchema(file, {
  provider: z.enum(["S3"]).default("S3"),
  key: z.string(),
  fileName: z.string().max(500),
  mimeType: z.string().max(100),
  fileSize: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
