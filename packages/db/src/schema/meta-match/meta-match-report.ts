import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "../auth";
import { response } from "../response/response";

export const metaMatchReport = pgTable(
  "meta_match_reports",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    algorithmVersion: text("algorithm_version").notNull(),
    birthDate: timestamp("birth_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    companyBirthDate: timestamp("company_birth_date", {
      withTimezone: true,
      mode: "date",
    }),
    consentGranted: boolean("consent_granted").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    disclaimer: text("disclaimer").notNull(),
    managerBirthDate: timestamp("manager_birth_date", {
      withTimezone: true,
      mode: "date",
    }),
    narrative: jsonb("narrative").$type<string[]>().notNull(),
    recommendations: jsonb("recommendations").$type<string[]>().notNull(),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    summaryMetrics: jsonb("summary_metrics")
      .$type<MetaMatchSummaryMetrics>()
      .notNull(),
    teamData: jsonb("team_data").$type<{
      memberProfiles: Array<{
        coreIndex: number;
        stabilityIndex: number;
        changeIndex: number;
        phase: string;
      }>;
      teamSize: number;
      dominantProfile: string;
    }>(),
  },
  (table) => ({
    candidateIdx: index("meta_match_candidate_idx").on(table.candidateId),
    createdAtIdx: index("meta_match_created_at_idx").on(table.createdAt),
    requestedByIdx: index("meta_match_requested_by_idx").on(table.requestedBy),
  }),
);

export const MetaMatchSummaryMetricsSchema = z.object({
  synergy: z.number().int().min(0).max(10),
  temporalResonance: z.number().int().min(0).max(10),
  conflictRisk: z.number().int().min(0).max(10),
  moneyFlow: z.number().int().min(0).max(10),
  // Расширенные метрики для анализа компании (опционально)
  companySynergy: z.number().int().min(0).max(10).optional(),
  managerSynergy: z.number().int().min(0).max(10).optional(),
  // Командный баланс (опционально)
  teamBalance: z.number().int().min(0).max(10).optional(),
});

export type MetaMatchSummaryMetrics = z.infer<
  typeof MetaMatchSummaryMetricsSchema
>;

export const CreateMetaMatchReportSchema = createInsertSchema(metaMatchReport, {
  candidateId: z.string().uuid(),
  birthDate: z.coerce.date(),
  companyBirthDate: z.coerce.date().optional(),
  managerBirthDate: z.coerce.date().optional(),
  summaryMetrics: MetaMatchSummaryMetricsSchema,
  narrative: z.array(z.string().min(1)).min(1),
  recommendations: z.array(z.string().min(1)).min(1),
  disclaimer: z.string().min(1),
  algorithmVersion: z.string().min(1),
  consentGranted: z.boolean(),
  requestedBy: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
});

export type MetaMatchReport = typeof metaMatchReport.$inferSelect;
export type NewMetaMatchReport = typeof metaMatchReport.$inferInsert;
