import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { Organization, Workspace } from "../types";
import { styles } from "../styles";

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
      onError(
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
    <div style={styles.container}>
      <h2 style={styles.title}>Настройки</h2>
      <p style={styles.subtitle}>
        Выберите организацию и рабочее пространство для работы
      </p>

      {isLoadingSettings ? (
        <p style={styles.loading}>Загрузка…</p>
      ) : (
        <>
          <div style={styles.formGroup}>
            <label htmlFor="org-select" style={styles.label}>
              Организация
            </label>
            <select
              id="org-select"
              value={selectedOrgId ?? ""}
              onChange={(e) => handleOrgChange(e.target.value)}
              style={styles.select}
            >
              <option value="">Выберите организацию</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {selectedOrgId && (
            <div style={styles.formGroup}>
              <label htmlFor="workspace-select" style={styles.label}>
                Рабочее пространство
              </label>
              <select
                id="workspace-select"
                value={selectedWorkspaceId ?? ""}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                style={styles.select}
              >
                <option value="">Выберите рабочее пространство</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={!selectedOrgId || !selectedWorkspaceId}
            style={{
              ...styles.siteLoginButton,
              color: "#fff",
              backgroundColor: "#2563eb",
              border: "none",
              marginBottom: 8,
            }}
          >
            Сохранить
          </button>

          <button type="button" onClick={onClose} style={styles.logoutButton}>
            Отмена
          </button>
        </>
      )}

      <p style={styles.version}>v{version}</p>
    </div>
  );
}
