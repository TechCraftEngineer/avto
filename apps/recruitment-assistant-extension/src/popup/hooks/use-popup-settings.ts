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
    selectedWorkspaceId: string | null,
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
        const orgs = orgsResp.data as Organization[];
        setOrganizations(orgs);

        // Если организация не выбрана — выбираем первую по умолчанию
        const effectiveOrgId =
          selectedOrgId ?? (orgs.length > 0 ? orgs[0]?.id : null);

        if (effectiveOrgId) {
          const wsResp = await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl(
                `workspaces?organizationId=${encodeURIComponent(effectiveOrgId)}`,
              ),
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          });

          if (wsResp?.success && Array.isArray(wsResp.data)) {
            const wss = wsResp.data as Workspace[];
            setWorkspaces(wss);

            // Если workspace не выбран — выбираем первый по умолчанию и сохраняем
            const effectiveWorkspaceId =
              selectedWorkspaceId ?? (wss.length > 0 ? wss[0]?.id : null);

            if (effectiveWorkspaceId && (!selectedOrgId || !selectedWorkspaceId)) {
              const { userData } = await chrome.storage.local.get(["userData"]);
              const user = userData as Record<string, unknown> | undefined;
              await chrome.storage.local.set({
                userData: {
                  ...user,
                  organizationId: effectiveOrgId,
                },
                workspaceId: effectiveWorkspaceId,
              });
            }
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
