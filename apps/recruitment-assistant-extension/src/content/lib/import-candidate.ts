/**
 * Импорт кандидата в систему через API
 * Требования 10.1, 10.2, 10.3, 10.4, 1.9
 *
 * При указании vacancyId — импорт идёт в конкретную вакансию (POST /api/extension/import-resume).
 */

import type {
  CandidateData,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";
import { showNotification } from "./notifications";

export interface CheckDuplicateResult {
  existing: boolean;
  candidate?: {
    id: string;
    fullName: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    telegramUsername?: string | null;
    headline?: string | null;
    location?: string | null;
    resumeUrl?: string | null;
  };
}

export async function checkDuplicateCandidate(
  data: CandidateData,
): Promise<CheckDuplicateResult> {
  const result = await chrome.storage.local.get(["authToken", "userData"]);
  const token = result.authToken as string | undefined;
  const userData = result.userData as { organizationId?: string } | undefined;

  if (!token || !userData?.organizationId) {
    throw new Error("Требуется авторизация");
  }

  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  const { getExtensionApiUrl } = await import("../../config");
  const body = {
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      platformProfileUrl: profileUrl, // обязателен при скрытых контактах (HH)
    },
    organizationId: userData.organizationId,
  };

  const resp = await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    payload: {
      url: getExtensionApiUrl("check-duplicate-candidate"),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  });

  if (!resp?.success) {
    throw new Error(resp?.error ?? "Ошибка проверки дубликата");
  }

  return {
    existing: resp.data?.existing ?? false,
    candidate: resp.data?.candidate,
  };
}

export async function importToVacancyWithExisting(
  data: CandidateData,
  options: { vacancyId: string; globalCandidateId: string },
): Promise<void> {
  const result = await chrome.storage.local.get(["authToken", "userData"]);
  const token = result.authToken as string | undefined;

  if (!token) {
    showNotification({
      type: "error",
      message: "Войдите в систему через расширение.",
    });
    throw new Error("Требуется авторизация");
  }

  await importToVacancy(
    data,
    token,
    options.vacancyId,
    options.globalCandidateId,
  );
}

const VALID_PLATFORM_SOURCES = ["HH", "LINKEDIN", "WEB_LINK"] as const;
type ValidPlatformSource = (typeof VALID_PLATFORM_SOURCES)[number];

/** Извлекает username Telegram из socialLinks (t.me/xxx, telegram.me/xxx) */
function extractTelegramFromSocialLinks(
  socialLinks?: string[] | null,
): string | undefined {
  if (!socialLinks?.length) return undefined;
  const telegramHosts = ["t.me", "telegram.me"];
  const usernamePattern = /^\/?(?:dg\/)?([a-zA-Z0-9_]{4,32})(?:[/?#]|$)/;
  for (const link of socialLinks) {
    try {
      const u = new URL(link);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      if (!telegramHosts.includes(host)) continue;
      const match = u.pathname.match(usernamePattern);
      if (match?.[1]) return match[1];
    } catch {
      // Not a valid URL, skip
    }
  }
  return undefined;
}

/** Преобразует данные расширения в profileData для import-resume */
function buildProfileDataForImport(
  data: CandidateData,
  profileUrl: string | undefined,
  aboutMe?: string,
): {
  platform?: string;
  profileUrl?: string;
  aboutMe?: string;
  skills?: string[];
  experience?: Array<{
    company?: string;
    position?: string;
    period?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    period?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  parsedAt: string;
} {
  const mapExp = (e: ExperienceEntry) => {
    const start =
      e.startDate instanceof Date
        ? e.startDate.toISOString().slice(0, 7)
        : e.startDate;
    const end =
      e.endDate instanceof Date
        ? e.endDate.toISOString().slice(0, 7)
        : e.endDate;
    const period = [start, end].filter(Boolean).join(" — ") || undefined;
    return {
      company: e.company ?? undefined,
      position: e.position,
      period,
      description: e.description ?? undefined,
    };
  };
  const mapEdu = (e: EducationEntry) => {
    const start = e.startDate;
    const end = e.endDate;
    const period = [start, end].filter(Boolean).join(" — ") || undefined;
    return {
      institution: e.institution,
      degree: e.degree ?? undefined,
      period,
      field: e.field ?? e.fieldOfStudy ?? undefined,
      startDate: e.startDate,
      endDate: e.endDate,
    };
  };
  return {
    platform: data.platform,
    profileUrl,
    aboutMe: aboutMe || undefined,
    skills: data.skills?.length ? data.skills : undefined,
    experience: data.experience?.length
      ? data.experience.map(mapExp)
      : undefined,
    education: data.education?.length ? data.education.map(mapEdu) : undefined,
    parsedAt: new Date().toISOString(),
  };
}

/** API import-resume/import-candidate-global принимает только HH, WEB_LINK и др. — без LINKEDIN */
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

function isValidPlatformSource(value: unknown): value is ValidPlatformSource {
  return (
    typeof value === "string" &&
    VALID_PLATFORM_SOURCES.includes(value as ValidPlatformSource)
  );
}

function inferPlatformSourceFromContext(): ValidPlatformSource {
  if (typeof window !== "undefined") {
    const host = window.location.host.toLowerCase();
    if (host.includes("hh.") || host.includes("headhunter")) return "HH";
    if (host.includes("linkedin")) return "LINKEDIN";
  }
  return "WEB_LINK";
}

/** Преобразует внутренний platformSource в значение, принимаемое API */
function toApiPlatformSource(
  source: ValidPlatformSource,
): (typeof API_ACCEPTED_SOURCES)[number] {
  if (source === "LINKEDIN") return "WEB_LINK";
  if (source === "HH") return "HH";
  return "WEB_LINK";
}

export function buildResponseText(
  data: CandidateData,
  rawSource: ValidPlatformSource | string,
): string {
  const isLinkedIn = String(rawSource).toUpperCase() === "LINKEDIN";
  const parts: string[] = [];
  if (data.basicInfo.currentPosition)
    parts.push(data.basicInfo.currentPosition);
  if (data.basicInfo.location)
    parts.push(`Локация: ${data.basicInfo.location}`);
  if (data.skills?.length) parts.push(`Навыки: ${data.skills.join(", ")}`);
  if (isLinkedIn && data.experience?.length) {
    const expLines = data.experience.map((e) => {
      const duration =
        e.startDate || e.endDate
          ? [e.startDate, e.endDate].filter(Boolean).join(" — ")
          : "";
      return `• ${e.position}${e.company ? ` в ${e.company}` : ""}${duration ? ` (${duration})` : ""}`;
    });
    parts.push(`Опыт:\n${expLines.join("\n")}`);
  }
  if (isLinkedIn && data.education?.length) {
    const eduLines = data.education.map((e) => {
      const years =
        e.startDate || e.endDate
          ? [e.startDate, e.endDate].filter(Boolean).join(" — ")
          : "";
      return `• ${e.institution}${e.degree ? `, ${e.degree}` : ""}${years ? ` (${years})` : ""}`;
    });
    parts.push(`Образование:\n${eduLines.join("\n")}`);
  }
  return parts.filter(Boolean).join("\n\n") || "Импортировано из расширения";
}

export async function importToGlobalOnly(
  options:
    | {
        globalCandidateId: string;
        workspaceId: string;
        platformSource?: string;
      }
    | {
        workspaceId: string;
        candidateData: {
          platformSource: string;
          freelancerName?: string;
          contactInfo?: {
            email?: string;
            phone?: string;
            platformProfileUrl?: string;
          };
          responseText?: string;
        };
      },
): Promise<void> {
  const result = await chrome.storage.local.get(["authToken"]);
  const token = result.authToken as string | undefined;

  if (!token) {
    showNotification({
      type: "error",
      message: "Войдите в систему через расширение.",
    });
    throw new Error("Требуется авторизация");
  }

  const rawSource =
    "globalCandidateId" in options
      ? isValidPlatformSource(options.platformSource)
        ? options.platformSource
        : inferPlatformSourceFromContext()
      : isValidPlatformSource(options.candidateData.platformSource)
        ? options.candidateData.platformSource
        : inferPlatformSourceFromContext();

  const body =
    "globalCandidateId" in options
      ? {
          globalCandidateId: options.globalCandidateId,
          platformSource: toApiPlatformSource(rawSource),
          freelancerName: "",
          responseText: "",
        }
      : {
          ...options.candidateData,
          platformSource: toApiPlatformSource(rawSource),
        };

  const { getExtensionApiUrl } = await import("../../config");
  const resp = await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    payload: {
      url: getExtensionApiUrl(
        `import-candidate-global?workspaceId=${encodeURIComponent(options.workspaceId)}`,
      ),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  });

  if (!resp?.success) {
    throw new Error(resp?.error ?? "Ошибка сохранения");
  }

  showNotification({
    type: "success",
    message: "Кандидат добавлен в базу без привязки к вакансии",
  });
}

export async function importCandidateData(
  data: CandidateData,
  options?: { vacancyId?: string; globalCandidateId?: string },
): Promise<void> {
  const result = await chrome.storage.local.get(["authToken", "userData"]);
  const token = result.authToken as string | undefined;
  const userData = result.userData as { organizationId?: string } | undefined;

  if (!token || !userData?.organizationId) {
    showNotification({
      type: "error",
      message: "Войдите в систему через расширение для импорта кандидатов.",
    });
    throw new Error("Требуется авторизация");
  }

  if (options?.vacancyId) {
    await importToVacancy(
      data,
      token,
      options.vacancyId,
      options.globalCandidateId,
    );
    return;
  }

  showNotification({ type: "info", message: "Импорт данных в систему…" });

  const { API_URL } = await import("../../config");
  const { ApiClient } = await import("../../core/api-client");
  const apiClient = new ApiClient({
    apiUrl: API_URL,
    apiToken: token,
    organizationId: userData.organizationId,
  });

  const response = await apiClient.importCandidate(
    data,
    userData.organizationId,
  );

  const candidateId =
    response.candidateId ?? response.candidateOrganizationId ?? "неизвестен";
  showNotification({
    type: "success",
    message: `Кандидат успешно импортирован в систему (ID: ${candidateId})`,
  });
}

async function importToVacancy(
  data: CandidateData,
  token: string,
  vacancyId: string,
  globalCandidateId?: string,
): Promise<void> {
  const platformLower = data.platform?.toLowerCase() ?? "";
  const rawSource =
    platformLower.includes("headhunter") || platformLower.includes("hh")
      ? "HH"
      : platformLower.includes("linkedin")
        ? "LINKEDIN"
        : "WEB_LINK";
  const platformSource = toApiPlatformSource(rawSource);

  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  const responseText = buildResponseText(data, rawSource);

  const candidateName = data.basicInfo.fullName ?? "Кандидат";

  let photoUrl: string | undefined;
  let resumePdfBase64: string | undefined;
  let resumeTextHtml: string | undefined;

  if (rawSource === "LINKEDIN" && typeof document !== "undefined") {
    const photoSrc = data.basicInfo?.photoUrl;
    if (
      photoSrc &&
      !photoSrc.includes("placeholder") &&
      !photoSrc.includes("blank")
    ) {
      try {
        const { fetchImageAsBase64ViaExtension } = await import(
          "../../parsers/hh-employer/fetch-resume-html"
        );
        const { base64, contentType } =
          await fetchImageAsBase64ViaExtension(photoSrc);
        photoUrl = `data:${contentType};base64,${base64}`;
      } catch {
        // Сеть или таймаут — продолжаем без фото
      }
    }
  }

  if (rawSource === "HH" && typeof document !== "undefined") {
    const { fetchPhotoAsBase64, fetchResumePdfAsBase64 } = await import(
      "../../parsers/hh-employer/fetch-resume-html"
    );
    const { getResumePdfUrl, fetchResumeTextHtml } = await import(
      "../../parsers/hh-employer/fetch-resume-text"
    );

    const photoImg = document.querySelector<HTMLImageElement>(
      'div[data-qa="resume-photo"] img',
    );
    const photoSrc = photoImg?.src || data.basicInfo?.photoUrl || undefined;

    if (
      photoSrc &&
      !photoSrc.includes("placeholder") &&
      !photoSrc.includes("no-photo")
    ) {
      try {
        const { base64, contentType } = await fetchPhotoAsBase64(photoSrc);
        photoUrl = `data:${contentType};base64,${base64}`;
      } catch {
        // Продолжаем без фото
      }
    }

    if (profileUrl) {
      try {
        resumeTextHtml = await fetchResumeTextHtml(profileUrl, candidateName, {
          baseOrigin: window.location.origin,
        });
      } catch {
        // Продолжаем без HTML
      }

      const pdfUrl = getResumePdfUrl(profileUrl, candidateName);
      if (pdfUrl) {
        try {
          const { base64 } = await fetchResumePdfAsBase64(pdfUrl);
          resumePdfBase64 = base64;
        } catch {
          // Продолжаем без PDF
        }
      }
    }
  }

  const telegram = extractTelegramFromSocialLinks(data.contacts?.socialLinks);

  let aboutMe: string | undefined;
  if (rawSource === "LINKEDIN" && typeof document !== "undefined") {
    const { parseAbout } = await import("../../parsers/linkedin");
    aboutMe = parseAbout(document) || undefined;
  }

  const profileDataForImport = buildProfileDataForImport(
    data,
    profileUrl,
    aboutMe,
  );
  const hasStructuredData =
    profileDataForImport.experience?.length ||
    profileDataForImport.education?.length ||
    profileDataForImport.skills?.length ||
    profileDataForImport.aboutMe;

  const { getExtensionApiUrl } = await import("../../config");
  const body: Record<string, unknown> = {
    vacancyId,
    ...(globalCandidateId ? { globalCandidateId } : {}),
    platformSource,
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      telegram: telegram || undefined,
      platformProfileUrl: profileUrl,
    },
    responseText: responseText || "Импортировано из расширения",
  };

  if (photoUrl) body.photoUrl = photoUrl;
  if (resumePdfBase64) body.resumePdfBase64 = resumePdfBase64;
  if (resumeTextHtml) body.resumeTextHtml = resumeTextHtml;
  if (hasStructuredData) {
    body.profileData = profileDataForImport;
  }
  if (data.skills?.length) {
    body.skills = data.skills;
  }

  const resp = await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    payload: {
      url: getExtensionApiUrl("import-resume"),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  });

  if (!resp?.success) {
    throw new Error(resp?.error ?? "Ошибка импорта");
  }
}
