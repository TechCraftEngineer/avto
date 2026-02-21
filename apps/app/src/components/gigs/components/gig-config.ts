/**
 * Централизованная конфигурация типов разовых заданий (gigs)
 * Используется для отображения лейблов и других метаданных
 */

import type { gigTypeValues } from "@qbs-autonaim/db/schema";

export type GigType = (typeof gigTypeValues)[number];

export type DisplayMode = "grid" | "table";

export interface GigTypeConfig {
  value: GigType;
  label: string;
  description?: string;
}

export const gigTypesConfig: GigTypeConfig[] = [
  { value: "DEVELOPMENT", label: "Разработка" },
  { value: "DESIGN", label: "Дизайн" },
  { value: "COPYWRITING", label: "Копирайтинг" },
  { value: "MARKETING", label: "Маркетинг" },
  { value: "TRANSLATION", label: "Перевод" },
  { value: "VIDEO", label: "Видео" },
  { value: "AUDIO", label: "Аудио" },
  { value: "DATA_ENTRY", label: "Ввод данных" },
  { value: "RESEARCH", label: "Исследования" },
  { value: "CONSULTING", label: "Консультации" },
  {
    value: "OTHER",
    label: "Другое",
    description: "Категория для заданий, не подходящих под остальные",
  },
] as const;

/**
 * Map для быстрого доступа к лейблам по значению типа
 */
export const gigTypeLabels: Record<GigType, string> = gigTypesConfig.reduce(
  (acc, type) => {
    acc[type.value] = type.label;
    return acc;
  },
  {} as Record<GigType, string>,
);

/**
 * Получить лейбл по типу задания
 */
export function getGigTypeLabel(type: string): string {
  return gigTypeLabels[type as GigType] || type;
}

/**
 * Получить описание по типу задания
 */
export function getGigTypeDescription(type: string): string | undefined {
  return gigTypesConfig.find((t) => t.value === type)?.description;
}
