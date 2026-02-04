/**
 * Хелперы для валидации телефонов в Zod схемах
 */

import { z } from "zod";
import { normalizePhone } from "./phone-utils";

/**
 * Трансформер для нормализации телефона в Zod схемах (optional)
 * Использует libphonenumber-js для валидации и нормализации
 */
export const phoneTransform = (val: string | undefined) => {
  if (!val) return val;
  return normalizePhone(val);
};

/**
 * Трансформер для нормализации телефона в Zod схемах (nullish)
 * Использует libphonenumber-js для валидации и нормализации
 */
export const phoneTransformNullish = (val: string | null | undefined) => {
  if (!val) return undefined;
  return normalizePhone(val);
};

/**
 * Готовая Zod схема для телефона (optional)
 */
export const phoneSchema = z
  .string()
  .max(50)
  .optional()
  .transform(phoneTransform);

/**
 * Готовая Zod схема для телефона (nullish)
 * Преобразует null в undefined после нормализации
 */
export const phoneNullishSchema = z
  .string()
  .max(50)
  .nullish()
  .transform(phoneTransformNullish);

/**
 * Готовая Zod схема для телефона (required)
 */
export const phoneRequiredSchema = z
  .string()
  .max(50)
  .transform((val) => normalizePhone(val));
