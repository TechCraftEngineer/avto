import "./popup.css";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DefaultView } from "./components/default-view";
import { LoginView } from "./components/login-view";
import { PopupHeader } from "./components/popup-header";
import { ProfileView } from "./components/profile-view";
import { ResponsesView } from "./components/responses-view";
import { VacanciesView } from "./components/vacancies-view";
import { usePageContext } from "./hooks/use-page-context";
import { usePopupAuth } from "./hooks/use-popup-auth";
import { usePopupSettings } from "./hooks/use-popup-settings";

const settingsProps = (
  auth: ReturnType<typeof usePopupAuth>,
  settings: ReturnType<typeof usePopupSettings>,
  settingsError: string | null,
  setSettingsError: (err: string | null) => void,
) => ({
  authService: auth.authService,
  selectedOrgId: auth.selectedOrgId,
  setSelectedOrgId: auth.setSelectedOrgId,
  selectedWorkspaceId: auth.selectedWorkspaceId,
  setSelectedWorkspaceId: auth.setSelectedWorkspaceId,
  organizations: settings.organizations,
  workspaces: settings.workspaces,
  setWorkspaces: settings.setWorkspaces,
  isLoadingSettings: settings.isLoadingSettings,
  settingsError,
  onSettingsError: setSettingsError,
});

/**
 * Popup расширения — авторизация и контекстные действия.
 * На страницах hh.ru/LinkedIn показывает кнопку «Импортировать».
 */
function Popup() {
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const auth = usePopupAuth();
  const { pageContext, selectedCount, setSelectedCount } = usePageContext();
  const settings = usePopupSettings(auth.authService);

  // biome-ignore lint/correctness/useExhaustiveDependencies: auth.authService is stable
  useEffect(() => {
    if (auth.isAuthenticated) {
      setSettingsError(null);
      settings
        .loadOrganizationsAndWorkspaces(
          auth.selectedOrgId,
          auth.selectedWorkspaceId,
        )
        .then((err) => setSettingsError(err ?? null));
    }
  }, [auth.isAuthenticated]);

  if (auth.isAuthenticated === null) {
    const version = chrome.runtime.getManifest().version;
    return (
      <div className="flex min-w-[360px] max-w-[420px] flex-col items-center justify-center gap-4 p-4 font-sans text-sm">
        <PopupHeader />
        <p className="text-muted-foreground">Загрузка…</p>
        <p className="text-center text-xs text-muted-foreground">v{version}</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginView />;
  }

  const layoutProps = settingsProps(
    auth,
    settings,
    settingsError,
    setSettingsError,
  );

  if (pageContext?.type === "hh-responses") {
    return (
      <ResponsesView
        userEmail={auth.userEmail}
        onLogout={auth.logout}
        {...layoutProps}
      />
    );
  }

  if (pageContext?.type === "hh-vacancies") {
    return (
      <VacanciesView
        pageContext={pageContext}
        selectedCount={selectedCount}
        userEmail={auth.userEmail}
        onLogout={auth.logout}
        onImportSuccess={() => setSelectedCount(0)}
        {...layoutProps}
      />
    );
  }

  if (pageContext?.type === "profile") {
    return (
      <ProfileView
        pageContext={pageContext}
        userEmail={auth.userEmail}
        onLogout={auth.logout}
        {...layoutProps}
      />
    );
  }

  return (
    <DefaultView
      userEmail={auth.userEmail}
      onLogout={auth.logout}
      {...layoutProps}
    />
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
