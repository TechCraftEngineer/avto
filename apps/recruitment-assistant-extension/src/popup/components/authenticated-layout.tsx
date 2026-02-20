import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { Organization, Workspace } from "../types";
import { Alert, Button, Label, Select } from "../ui";
import { PopupHeader } from "./popup-header";

interface AuthenticatedLayoutProps {
  userEmail: string | null;
  onLogout: () => void;
  authService: AuthService;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  organizations: Organization[];
  workspaces: Workspace[];
  setWorkspaces: (ws: Workspace[]) => void;
  isLoadingSettings: boolean;
  settingsError: string | null;
  onSettingsError: (err: string | null) => void;
  children: React.ReactNode;
}

export function AuthenticatedLayout({
  userEmail,
  onLogout,
  authService,
  selectedOrgId,
  setSelectedOrgId,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  organizations,
  workspaces,
  setWorkspaces,
  isLoadingSettings,
  settingsError,
  onSettingsError,
  children,
}: AuthenticatedLayoutProps) {
  const version = chrome.runtime.getManifest().version;

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedWorkspaceId(null);
    setWorkspaces([]);

    const token = await authService.getToken();
    if (!token) return;

    try {
      const wsResp = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl(
            `workspaces?organizationId=${encodeURIComponent(orgId)}`
          ),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      if (wsResp?.success && Array.isArray(wsResp.data)) {
        setWorkspaces(wsResp.data);
      }
    } catch (e) {
      onSettingsError(
        e instanceof Error ? e.message : "Ошибка загрузки рабочего пространства"
      );
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    await chrome.storage.local.set({ workspaceId });
  };

  const handleSaveSettings = async () => {
    if (!selectedOrgId || !selectedWorkspaceId) {
      onSettingsError("Выберите организацию и рабочее пространство");
      return;
    }

    const userData = await authService.getUserData();
    await chrome.storage.local.set({
      userData: { ...userData, organizationId: selectedOrgId },
      workspaceId: selectedWorkspaceId,
    });

    onSettingsError(null);
  };

  return (
    <div className="flex min-w-[280px] flex-col gap-4 p-4 font-sans text-sm">
      <PopupHeader />
      {children}

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        <h3 className="text-sm font-semibold leading-tight">
          Организация и рабочее пространство
        </h3>
        {isLoadingSettings ? (
          <p className="text-muted-foreground text-sm">Загрузка…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org-select" className="text-xs">
                Организация
              </Label>
              <Select
                id="org-select"
                value={selectedOrgId ?? ""}
                onChange={(e) => handleOrgChange(e.target.value)}
              >
                <option value="">Выберите организацию</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedOrgId && (
              <div className="space-y-1.5">
                <Label htmlFor="workspace-select" className="text-xs">
                  Рабочее пространство
                </Label>
                <Select
                  id="workspace-select"
                  value={selectedWorkspaceId ?? ""}
                  onChange={(e) => handleWorkspaceChange(e.target.value)}
                >
                  <option value="">Выберите рабочее пространство</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {settingsError && (
              <Alert variant="destructive">{settingsError}</Alert>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSaveSettings}
              disabled={!selectedOrgId || !selectedWorkspaceId}
            >
              Сохранить настройки
            </Button>
          </div>
        )}
      </div>

      <p className="font-medium text-foreground">{userEmail}</p>
      <div className="flex flex-col gap-2">
        <Button variant="destructive" className="w-full" onClick={onLogout}>
          Выйти
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">v{version}</p>
    </div>
  );
}
