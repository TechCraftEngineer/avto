/**
 * Импорт кандидата в систему через API
 * Требования 10.1, 10.2, 10.3, 10.4, 1.9
 */

import type { CandidateData } from "../../shared/types";
import { showNotification } from "./notifications";

export async function importCandidateData(data: CandidateData): Promise<void> {
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
