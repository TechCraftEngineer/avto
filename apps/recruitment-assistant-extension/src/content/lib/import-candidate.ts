/**
 * Импорт кандидата в систему через API
 * Требования 10.1, 10.2, 10.3, 10.4, 1.9
 *
 * При указании vacancyId — импорт идёт в конкретную вакансию (POST /api/extension/import-resume).
 */

import type { CandidateData } from "../../shared/types";
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

const VALID_PLATFORM_SOURCES = ["HH", "WEB_LINK"] as const;
type ValidPlatformSource = (typeof VALID_PLATFORM_SOURCES)[number];

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
  }
  return "WEB_LINK";
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

  const body =
    "globalCandidateId" in options
      ? {
          globalCandidateId: options.globalCandidateId,
          platformSource: isValidPlatformSource(options.platformSource)
            ? options.platformSource
            : inferPlatformSourceFromContext(),
          freelancerName: "",
          responseText: "",
        }
      : {
          ...options.candidateData,
          platformSource: isValidPlatformSource(
            options.candidateData.platformSource,
          )
            ? options.candidateData.platformSource
            : inferPlatformSourceFromContext(),
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
  const platformSource =
    data.platform?.toLowerCase().includes("headhunter") ||
    data.platform?.toLowerCase().includes("hh")
      ? "HH"
      : "WEB_LINK";

  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  const responseText = [
    data.basicInfo.currentPosition || "",
    data.basicInfo.location ? `Локация: ${data.basicInfo.location}` : "",
    data.skills?.length ? `Навыки: ${data.skills.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const candidateName = data.basicInfo.fullName ?? "Кандидат";

  let photoUrl: string | undefined;
  let resumePdfBase64: string | undefined;
  let resumeTextHtml: string | undefined;

  if (platformSource === "HH" && typeof document !== "undefined") {
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

  const { getExtensionApiUrl } = await import("../../config");
  const body: Record<string, unknown> = {
    vacancyId,
    ...(globalCandidateId ? { globalCandidateId } : {}),
    platformSource,
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      platformProfileUrl: profileUrl, // обязателен при скрытых контактах (HH)
    },
    responseText: responseText || "Импортировано из расширения",
  };

  if (photoUrl) body.photoUrl = photoUrl;
  if (resumePdfBase64) body.resumePdfBase64 = resumePdfBase64;
  if (resumeTextHtml) body.resumeTextHtml = resumeTextHtml;

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
