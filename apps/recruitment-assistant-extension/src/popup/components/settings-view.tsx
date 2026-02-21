import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { Organization, Workspace } from "../types";
import { Alert, Button, Label, Select } from "../ui";
import { PopupHeader } from "./popup-header";

interface SettingsViewProps {
  authService: AuthService;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  organizations: Organization[];
  workspaces: Workspace[];
  setWorkspaces: (ws: Workspace[]) => void;
  isLoadingSettings: boolean;
  error: string | null;
  onError: (err: string | null) => void;
  onClose: () => void;
}

export function SettingsView({
  authService,
  selectedOrgId,
  setSelectedOrgId,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  organizations,
  workspaces,
  setWorkspaces,
  isLoadingSettings,
  error,
  onError,
  onClose,
}: SettingsViewProps) {
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
            `workspaces?organizationId=${encodeURIComponent(orgId)}`,
          ),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      if (wsResp?.success && Array.isArray(wsResp.data)) {
        setWorkspaces(wsResp.data);
      }
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Ошибка загрузки рабочего пространства",
      );
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    await chrome.storage.local.set({ workspaceId });
  };

  const handleSaveSettings = async () => {
    if (!selectedOrgId || !selectedWorkspaceId) {
      onError("Выберите организацию и рабочее пространство");
      return;
    }

    const userData = await authService.getUserData();
    await chrome.storage.local.set({
      userData: { ...userData, organizationId: selectedOrgId },
      workspaceId: selectedWorkspaceId,
    });

    onClose();
    onError(null);
  };

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="flex min-w-[400px] flex-col gap-4 p-4 font-sans text-sm">
      <PopupHeader />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold leading-tight">Настройки</h2>
        <p className="text-muted-foreground text-sm">
          Выберите организацию и рабочее пространство для работы
        </p>
      </div>

      {isLoadingSettings ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-select">Организация</Label>
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
            <div className="space-y-2">
              <Label htmlFor="workspace-select">Рабочее пространство</Label>
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

          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleSaveSettings}
              disabled={!selectedOrgId || !selectedWorkspaceId}
            >
              Сохранить
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">v{version}</p>
    </div>
  );
}
