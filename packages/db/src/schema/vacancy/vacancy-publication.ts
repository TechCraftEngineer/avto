import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  platformSourceEnum,
  platformSourceValues,
} from "../shared/response-enums";
import { vacancy } from "./vacancy";

/**
 * Публикация вакансии на внешней платформе
 */
export const vacancyPublication = pgTable(
  "vacancy_publications",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Ссылка на внутреннюю вакансию
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),

    // Платформа (HH, AVITO, и т.д.)
    platform: platformSourceEnum("platform").notNull(),

    // ID вакансии на внешней платформе
    externalId: varchar("external_id", { length: 100 }),

    // Прямая ссылка на вакансию на платформе
    url: text("url"),

    // Статус размещения
    isActive: boolean("is_active").default(true).notNull(),

    // Когда последний раз синхронизировали отклики
    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: true,
      mode: "date",
    }),

    // Когда последний раз проверяли статус публикации на платформе
    lastCheckedAt: timestamp("last_checked_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    vacancyIdx: index("vacancy_publication_vacancy_idx").on(table.vacancyId),
    platformExternalIdx: index("vacancy_publication_platform_external_idx").on(
      table.platform,
      table.externalId,
    ),
  }),
);

export const CreateVacancyPublicationSchema = createInsertSchema(
  vacancyPublication,
  {
    platform: z.enum(platformSourceValues),
    externalId: z.string().max(100).optional(),
    url: z.url().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyPublication = typeof vacancyPublication.$inferSelect;
export type NewVacancyPublication = typeof vacancyPublication.$inferInsert;
