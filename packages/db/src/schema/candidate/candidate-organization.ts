/**
 * Таблица связей кандидатов с организациями.
 * Позволяет одному кандидату быть связанным с несколькими организациями.
 * Хранит базовую информацию о связи - остальные данные (статусы, рейтинги) в responses.
 */

import { organizationIdSchema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organization } from "../organization/organization";
import { globalCandidate } from "./global-candidate";

/**
 * Статус кандидата в конкретной организации
 */
export const candidateOrganizationStatusEnum = pgEnum(
  "candidate_organization_status",
  [
    "ACTIVE", // Активный кандидат в базе организации
    "BLACKLISTED", // В черном списке организации
    "HIRED", // Принят на работу в организацию
  ],
);

/**
 * Таблица связей между глобальными кандидатами и организациями.
 * Хранит только базовую информацию о связи - остальные данные в responses.
 */
export const candidateOrganization = pgTable(
  "candidate_organizations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Связь с глобальным кандидатом
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => globalCandidate.id, { onDelete: "cascade" }),

    // Связь с организацией
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Статус кандидата в организации (общий - не дублирует status из responses)
    status: candidateOrganizationStatusEnum("status")
      .default("ACTIVE")
      .notNull(),

    // Дата добавления кандидата в организацию
    appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" }),

    // Теги для организации (для сегментации)
    tags: jsonb("tags").$type<string[]>(),

    // Заметки организации о кандидате
    notes: text("notes"),

    // Дополнительные метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Индексы для часто используемых запросов
    candidateOrgIdx: index("candidate_org_candidate_org_idx").on(
      table.candidateId,
      table.organizationId,
    ),
    candidateIdx: index("candidate_org_candidate_idx").on(table.candidateId),
    organizationIdx: index("candidate_org_organization_idx").on(
      table.organizationId,
    ),
    statusIdx: index("candidate_org_status_idx").on(table.status),
    appliedAtIdx: index("candidate_org_applied_at_idx").on(table.appliedAt),
    // Уникальный индекс - один кандидат может быть связан с организацией только один раз
    uniqueCandidateOrg: unique("candidate_organization_unique").on(
      table.candidateId,
      table.organizationId,
    ),
  }),
);

export const CreateCandidateOrganizationSchema = createInsertSchema(
  candidateOrganization,
  {
    candidateId: z.uuid(),
    organizationId: organizationIdSchema,
    status: z
      .enum(candidateOrganizationStatusEnum.enumValues)
      .default("ACTIVE"),
    appliedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CandidateOrganization = typeof candidateOrganization.$inferSelect;
export type NewCandidateOrganization =
  typeof candidateOrganization.$inferInsert;
