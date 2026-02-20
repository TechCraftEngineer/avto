import { useState } from "react";
import type { PageContext, Organization, Workspace } from "../types";
import type { AuthService } from "../../core/auth-service";
import { AuthenticatedLayout } from "./authenticated-layout";
import { Alert, Button } from "../ui";

interface VacanciesViewProps {
  pageContext: Extract<PageContext, { type: "hh-vacancies" }>;
  selectedCount: number | null;
  userEmail: string | null;
  onLogout: () => void;
  onImportSuccess: () => void;
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

export function VacanciesView({
  pageContext,
  selectedCount,
  userEmail,
  onLogout,
  onImportSuccess,
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
}: VacanciesViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportSelected = async () => {
    setError(null);
    setIsImporting(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        setError("Вкладка не найдена");
        return;
      }

      let resp: { ok?: boolean; error?: string } | undefined;
      try {
        resp = await chrome.tabs.sendMessage(tab.id, {
          type: "IMPORT_SELECTED_VACANCIES",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("Receiving end") ||
          msg.includes("Could not establish connection")
        ) {
          resp = await chrome.runtime.sendMessage({
            type: "EXECUTE_IMPORT_SELECTED_VACANCIES",
            payload: { tabId: tab.id },
          });
        } else {
          throw e;
        }
      }

      if (resp?.ok === false) {
        setError(resp.error ?? "Ошибка импорта");
      } else if (resp?.ok) {
        onImportSuccess();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось импортировать");
    } finally {
      setIsImporting(false);
    }
  };

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold leading-tight">
            {pageContext.isActive ? "Активные вакансии" : "Архивные вакансии"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Отметьте вакансии галочками на странице и загрузите выбранные в систему.
            Для импорта с нескольких страниц — перейдите на первую страницу списка.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={handleImportSelected}
          disabled={isImporting || (selectedCount ?? 0) === 0}
        >
          {isImporting
            ? "Импорт…"
            : `Загрузить выбранные (${selectedCount ?? 0})`}
        </Button>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>
    </AuthenticatedLayout>
  );
}
