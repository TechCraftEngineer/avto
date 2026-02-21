/**
 * Типы платформ и источников
 */

export const platformSourceValues = [
  "MANUAL",
  "HH",
  "AVITO",
  "SUPERJOB",
  "HABR",
  "KWORK",
  "FL_RU",
  "FREELANCE_RU",
  "WEB_LINK",
  "TELEGRAM",
] as const;

export type PlatformSource = (typeof platformSourceValues)[number];
