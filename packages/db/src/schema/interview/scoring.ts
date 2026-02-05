import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { response } from "../response/response";
import { interviewSession } from "./interview-session";

/**
 * Результаты скоринга интервью
 * Связан с interviewSession
 */
export const interviewScoring = pgTable(
  "interview_scorings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    analysis: text("analysis"),
    botUsageDetected: integer("bot_usage_detected"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    interviewSessionId: uuid("interview_session_id")
      .notNull()
      .unique()
      .references(() => interviewSession.id, { onDelete: "cascade" }),
    rating: integer("rating"),
    responseId: uuid("response_id").references(() => response.id, {
      onDelete: "cascade",
    }),
    score: integer("score").notNull(),
  },
  (table) => [
    index("interview_scoring_session_idx").on(table.interviewSessionId),
    index("interview_scoring_response_idx").on(table.responseId),
    index("interview_scoring_score_idx").on(table.score),
    check(
      "interview_scoring_score_check",
      sql`${table.score} BETWEEN 0 AND 100`,
    ),
    check(
      "interview_scoring_rating_check",
      sql`${table.rating} IS NULL OR ${table.rating} BETWEEN 0 AND 5`,
    ),
    check(
      "interview_scoring_bot_usage_check",
      sql`${table.botUsageDetected} IS NULL OR ${table.botUsageDetected} BETWEEN 0 AND 100`,
    ),
  ],
);

export const CreateInterviewScoringSchema = createInsertSchema(
  interviewScoring,
  {
    interviewSessionId: uuidv7Schema,
    responseId: uuidv7Schema.optional(),
    rating: z.number().int().min(0).max(5).optional(),
    score: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
    botUsageDetected: z.number().int().min(0).max(100).optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type InterviewScoring = typeof interviewScoring.$inferSelect;
export type NewInterviewScoring = typeof interviewScoring.$inferInsert;
