import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export { verifyWorkspaceAccess };

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

export function handle2FAError(
  error: unknown,
  fallbackSessionData?: string,
): { requiresPassword: true; sessionData: string } | null {
  if (
    error instanceof Error &&
    (error.message.includes("SESSION_PASSWORD_NEEDED") ||
      error.message.includes("2FA is enabled"))
  ) {
    let sessionData: string | undefined;

    if ("data" in error && error.data && typeof error.data === "object") {
      const errorData = error.data as Record<string, unknown>;
      if (
        "sessionData" in errorData &&
        typeof errorData.sessionData === "string" &&
        errorData.sessionData.length > 0
      ) {
        sessionData = errorData.sessionData;
      }
    }

    if (!sessionData && fallbackSessionData) {
      sessionData = fallbackSessionData;
    }

    if (!sessionData) {
      return null;
    }

    return {
      requiresPassword: true,
      sessionData,
    };
  }
  return null;
}
