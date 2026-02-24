import type { AuthService } from "../../core/auth-service";
import type { Organization, Workspace } from "../types";
import { Hint } from "../ui";
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
        <div
          className="flex size-10 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-600"
          aria-hidden="true"
        >
          ✓
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-base font-semibold leading-tight text-balance">
            Всё готово!
          </h2>
          <p className="font-medium text-green-600">
            Расширение подключено к аккаунту
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed text-balance">
            Чтобы импортировать кандидата — откройте его профиль на одной из
            платформ.
          </p>
        </div>
        <Hint icon="steps">
          <span className="block">
            <strong>Как добавить кандидата:</strong>
          </span>
          <span className="mt-1 block">
            Откройте резюме на hh.ru или профиль на LinkedIn → нажмите «Извлечь
            данные» → затем «Импортировать».
          </span>
        </Hint>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <a
            href="https://hh.ru/employer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: "https://hh.ru/employer" });
            }}
          >
            Открыть hh.ru
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: "https://www.linkedin.com" });
            }}
          >
            Открыть LinkedIn
          </a>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
