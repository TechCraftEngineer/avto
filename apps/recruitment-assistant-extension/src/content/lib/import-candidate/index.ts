/**
 * Импорт кандидата в систему через API
 * Требования 10.1, 10.2, 10.3, 10.4, 1.9
 *
 * При указании vacancyId — импорт идёт в конкретную вакансию (POST /api/extension/import-resume).
 */

import type { CandidateData } from "../../../shared/types";
import { showNotification } from "../notifications";
import { getAuthFromStorage, sendExtensionApiRequest } from "./api-helpers";
import { importToVacancy } from "./import-to-vacancy";
import {
  inferPlatformSourceFromContext,
  isValidPlatformSource,
  toApiPlatformSource,
} from "./platform";
import type { CheckDuplicateResult } from "./types";

export { buildResponseText } from "./transformers";
export type { CheckDuplicateResult } from "./types";

export async function checkDuplicateCandidate(
  data: CandidateData,
): Promise<CheckDuplicateResult> {
  const { authToken: token, userData } = await getAuthFromStorage();

  if (!token || !userData?.organizationId) {
    throw new Error("Требуется авторизация");
  }

  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  const body = {
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      platformProfileUrl: profileUrl,
    },
    organizationId: userData.organizationId,
  };

  const resp = await sendExtensionApiRequest<{
    existing?: boolean;
    candidate?: CheckDuplicateResult["candidate"];
  }>("check-duplicate-candidate", {
    method: "POST",
    body,
    token,
  });

  return {
    existing: resp.data?.existing ?? false,
    candidate: resp.data?.candidate,
  };
}

export async function importToVacancyWithExisting(
  data: CandidateData,
  options: {
    vacancyId: string;
    globalCandidateId: string;
    linkedInSkillsHtml?: string | null;
    linkedInContactsHtml?: string | null;
  },
): Promise<void> {
  const { authToken: token } = await getAuthFromStorage();

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
    options.linkedInSkillsHtml ?? undefined,
    options.linkedInContactsHtml ?? undefined,
  );
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
  const { authToken: token } = await getAuthFromStorage();

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

  const endpoint = `import-candidate-global?workspaceId=${encodeURIComponent(options.workspaceId)}`;

  await sendExtensionApiRequest(endpoint, {
    method: "POST",
    body,
    token,
  });

  showNotification({
    type: "success",
    message: "Кандидат добавлен в базу без привязки к вакансии",
  });
}

export async function importCandidateData(
  data: CandidateData,
  options?: {
    vacancyId?: string;
    globalCandidateId?: string;
    linkedInSkillsHtml?: string | null;
    linkedInContactsHtml?: string | null;
  },
): Promise<void> {
  const { authToken: token, userData } = await getAuthFromStorage();

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
      options.linkedInSkillsHtml ?? undefined,
      options.linkedInContactsHtml ?? undefined,
    );
    return;
  }

  showNotification({ type: "info", message: "Импорт данных в систему…" });

  const { API_URL } = await import("../../../config");
  const { ApiClient } = await import("../../../core/api-client");
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
