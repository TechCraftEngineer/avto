/**
 * Определение платформы (HH, LinkedIn, WEB_LINK) и преобразование в значения API.
 * API import-resume принимает HH, WEB_LINK и др. — LINKEDIN маппится в WEB_LINK.
 */

export const VALID_PLATFORM_SOURCES = ["HH", "LINKEDIN", "WEB_LINK"] as const;
export type ValidPlatformSource = (typeof VALID_PLATFORM_SOURCES)[number];

const API_ACCEPTED_SOURCES = [
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

export function isValidPlatformSource(
  value: unknown,
): value is ValidPlatformSource {
  return (
    typeof value === "string" &&
    VALID_PLATFORM_SOURCES.includes(value as ValidPlatformSource)
  );
}

export function inferPlatformSourceFromContext(): ValidPlatformSource {
  if (typeof window !== "undefined") {
    const host = window.location.host.toLowerCase();
    if (host.includes("hh.") || host.includes("headhunter")) return "HH";
    if (host.includes("linkedin")) return "LINKEDIN";
  }
  return "WEB_LINK";
}

/** Преобразует внутренний platformSource в значение, принимаемое API */
export function toApiPlatformSource(
  source: ValidPlatformSource,
): (typeof API_ACCEPTED_SOURCES)[number] {
  if (source === "LINKEDIN") return "WEB_LINK";
  if (source === "HH") return "HH";
  return "WEB_LINK";
}

/** Определяет rawSource из данных кандидата (platform field) */
export function inferRawSourceFromData(
  platform?: string | null,
): ValidPlatformSource {
  const platformLower = platform?.toLowerCase() ?? "";
  if (platformLower.includes("headhunter") || platformLower.includes("hh")) {
    return "HH";
  }
  if (platformLower.includes("linkedin")) return "LINKEDIN";
  return "WEB_LINK";
}
