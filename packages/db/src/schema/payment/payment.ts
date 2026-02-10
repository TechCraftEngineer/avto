import {
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "../organization/organization";
import { workspace } from "../workspace/workspace";
import { paymentCurrencyEnum, paymentStatusEnum } from "./payment-enums";

/**
 * Таблица платежей через ЮКасса
 */
export const payment = pgTable(
  "payments",
  {
    // Внутренний ID
    id: uuid("id").primaryKey().defaultRandom(),

    // ID платежа в ЮКасса (уникальный)
    yookassaId: text("yookassa_id").notNull().unique(),

    // Ключ идемпотентности (уникальный)
    idempotenceKey: text("idempotence_key").notNull().unique(),

    // Связь с пользователем (NOT NULL, onDelete: restrict)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    // Связь с workspace (NOT NULL, onDelete: cascade)
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Связь с organization (NOT NULL, onDelete: cascade)
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Сумма платежа
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

    // Валюта
    currency: paymentCurrencyEnum("currency").notNull().default("RUB"),

    // Статус платежа
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Описание платежа
    description: text("description"),

    // URL для возврата пользователя
    returnUrl: text("return_url").notNull(),

    // URL подтверждения от ЮКасса
    confirmationUrl: text("confirmation_url"),

    // Метаданные (JSON)
    metadata: text("metadata"),

    // Даты
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Дата завершения платежа
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => ({
    // Индексы для оптимизации запросов
    userIdx: index("payment_user_idx").on(table.userId),
    workspaceIdx: index("payment_workspace_idx").on(table.workspaceId),
    organizationIdx: index("payment_organization_idx").on(table.organizationId),
    statusIdx: index("payment_status_idx").on(table.status),
    yookassaIdx: index("payment_yookassa_idx").on(table.yookassaId),
  }),
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
