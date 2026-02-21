import type { Organization, Workspace } from "../types";
import type { AuthService } from "../../core/auth-service";
import { AuthenticatedLayout } from "./authenticated-layout";

interface DefaultViewProps {
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
}

export function DefaultView({
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
}: DefaultViewProps) {
  return (
    <AuthenticatedLayout
      userEmail={userEmail}
      onLogout={onLogout}
      authService={authService}
      selectedOrgId={selectedOrgId}
      setSelectedOrgId={setSelectedOrgId}
      selectedWorkspaceId={selectedWorkspaceId}
      setSelectedWorkspaceId={setSelectedWorkspaceId}
      organizations={organizations}
      workspaces={workspaces}
      setWorkspaces={setWorkspaces}
      isLoadingSettings={isLoadingSettings}
      settingsError={settingsError}
      onSettingsError={onSettingsError}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-600">
          ✓
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-base font-semibold leading-tight">Всё готово!</h2>
          <p className="font-medium text-green-600">
            Расширение подключено к аккаунту
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Откройте профиль на LinkedIn или hh.ru для извлечения и импорта
            данных.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
