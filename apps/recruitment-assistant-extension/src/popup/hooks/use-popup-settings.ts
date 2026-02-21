import { useState } from "react";
import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { Organization, Workspace } from "../types";

export function usePopupSettings(authService: AuthService) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const loadOrganizationsAndWorkspaces = async (
    selectedOrgId: string | null,
  ): Promise<string | null> => {
    setIsLoadingSettings(true);
    try {
      const token = await authService.getToken();
      if (!token) {
        return "Токен не найден";
      }

      const orgsResp = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl("organizations"),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      if (orgsResp?.success && Array.isArray(orgsResp.data)) {
        setOrganizations(orgsResp.data);

        if (selectedOrgId) {
          const wsResp = await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl(
                `workspaces?organizationId=${encodeURIComponent(selectedOrgId)}`,
              ),
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          });

          if (wsResp?.success && Array.isArray(wsResp.data)) {
            setWorkspaces(wsResp.data);
          }
        }
      } else {
        return (
          (orgsResp as { error?: string } | undefined)?.error ??
          "Не удалось загрузить организации"
        );
      }
    } catch (e) {
      return e instanceof Error ? e.message : "Ошибка загрузки";
    } finally {
      setIsLoadingSettings(false);
    }
    return null;
  };

  return {
    organizations,
    setOrganizations,
    workspaces,
    setWorkspaces,
    isLoadingSettings,
    loadOrganizationsAndWorkspaces,
  };
}
