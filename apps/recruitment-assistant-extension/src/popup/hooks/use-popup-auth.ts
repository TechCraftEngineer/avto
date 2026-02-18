import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";
import { AuthService } from "../../core/auth-service";

export function usePopupAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const authService = useMemo(() => new AuthService(API_URL), []);

  useEffect(() => {
    const refresh = () => {
      authService.isAuthenticated().then(setIsAuthenticated);
      chrome.storage.local.get(["userData", "workspaceId"]).then((result) => {
        const user = result.userData as
          | { email?: string; organizationId?: string; workspaceId?: string }
          | undefined;
        if (user?.email) setUserEmail(user.email);
        if (user?.organizationId) setSelectedOrgId(user.organizationId);
        const wsId = (result.workspaceId as string) || user?.workspaceId;
        if (wsId) {
          setSelectedWorkspaceId(wsId);
          if (!result.workspaceId && user?.workspaceId) {
            chrome.storage.local.set({ workspaceId: user.workspaceId });
          }
        }
      });
    };
    refresh();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (
        areaName === "local" &&
        (changes.authToken || changes.userData || changes.workspaceId)
      ) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [authService]);

  const logout = async () => {
    await authService.logout();
    await chrome.storage.local.remove("workspaceId");
    setIsAuthenticated(false);
    setUserEmail(null);
    setSelectedOrgId(null);
    setSelectedWorkspaceId(null);
  };

  return {
    authService,
    isAuthenticated,
    userEmail,
    selectedOrgId,
    setSelectedOrgId,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    logout,
  };
}
