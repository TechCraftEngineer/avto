import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Enum'ы для платежной системы ЮКасса
 */

/**
 * Статус платежа
 */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "canceled",
]);

export const paymentStatusValues = [
  "pending",
  "succeeded",
  "canceled",
] as const;

export type PaymentStatus = (typeof paymentStatusValues)[number];

/**
 * Валюта платежа
 */
export const paymentCurrencyEnum = pgEnum("payment_currency", ["RUB"]);

export const paymentCurrencyValues = ["RUB"] as const;

export type PaymentCurrency = (typeof paymentCurrencyValues)[number];
