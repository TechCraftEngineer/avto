import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DefaultView } from "./components/default-view";
import { LoginView } from "./components/login-view";
import { ProfileView } from "./components/profile-view";
import { ResponsesView } from "./components/responses-view";
import { SettingsView } from "./components/settings-view";
import { VacanciesView } from "./components/vacancies-view";
import { usePageContext } from "./hooks/use-page-context";
import { usePopupAuth } from "./hooks/use-popup-auth";
import { usePopupSettings } from "./hooks/use-popup-settings";
import { styles } from "./styles";

/**
 * Popup расширения — авторизация и контекстные действия.
 * На страницах hh.ru/LinkedIn показывает кнопку «Извлечь данные».
 */
function Popup() {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const auth = usePopupAuth();
  const { pageContext, selectedCount, setSelectedCount } = usePageContext();
  const settings = usePopupSettings(auth.authService);

  const handleOpenSettings = () => {
    setShowSettings(true);
    setSettingsError(null);
    settings
      .loadOrganizationsAndWorkspaces(auth.selectedOrgId)
      .then((err) => setSettingsError(err ?? null));
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setSettingsError(null);
  };

  if (showSettings) {
    return (
      <SettingsView
        authService={auth.authService}
        selectedOrgId={auth.selectedOrgId}
        setSelectedOrgId={auth.setSelectedOrgId}
        selectedWorkspaceId={auth.selectedWorkspaceId}
        setSelectedWorkspaceId={auth.setSelectedWorkspaceId}
        organizations={settings.organizations}
        workspaces={settings.workspaces}
        setWorkspaces={settings.setWorkspaces}
        isLoadingSettings={settings.isLoadingSettings}
        error={settingsError}
        onError={setSettingsError}
        onClose={handleCloseSettings}
      />
    );
  }

  if (auth.isAuthenticated === null) {
    const version = chrome.runtime.getManifest().version;
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Загрузка…</p>
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginView />;
  }

  if (pageContext?.type === "hh-responses") {
    return (
      <ResponsesView
        userEmail={auth.userEmail}
        onOpenSettings={handleOpenSettings}
        onLogout={auth.logout}
      />
    );
  }

  if (pageContext?.type === "hh-vacancies") {
    return (
      <VacanciesView
        pageContext={pageContext}
        selectedCount={selectedCount}
        userEmail={auth.userEmail}
        onOpenSettings={handleOpenSettings}
        onLogout={auth.logout}
        onImportSuccess={() => setSelectedCount(0)}
      />
    );
  }

  if (pageContext?.type === "profile") {
    return (
      <ProfileView
        pageContext={pageContext}
        userEmail={auth.userEmail}
        onOpenSettings={handleOpenSettings}
        onLogout={auth.logout}
      />
    );
  }

  return (
    <DefaultView
      userEmail={auth.userEmail}
      onOpenSettings={handleOpenSettings}
      onLogout={auth.logout}
    />
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
