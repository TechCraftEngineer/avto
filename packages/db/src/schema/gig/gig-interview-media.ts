import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file/file";
import { gig } from "./gig";

/**
 * Join table for gig interview media files
 * Provides referential integrity between gigs and files
 */
export const gigInterviewMedia = pgTable(
  "gig_interview_media",
  {
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gigId, table.fileId] }),
    gigIdx: index("gig_interview_media_gig_idx").on(table.gigId),
    fileIdx: index("gig_interview_media_file_idx").on(table.fileId),
  }),
);

export const CreateGigInterviewMediaSchema = createInsertSchema(
  gigInterviewMedia,
  {
    gigId: z.uuid(),
    fileId: z.uuid(),
  },
).omit({
  createdAt: true,
});

export type GigInterviewMedia = typeof gigInterviewMedia.$inferSelect;
export type NewGigInterviewMedia = typeof gigInterviewMedia.$inferInsert;
