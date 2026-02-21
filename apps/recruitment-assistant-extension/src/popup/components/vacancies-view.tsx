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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImportSelected = async () => {
    setError(null);
    setSuccessMessage(null);
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

      let resp:
        | { ok?: boolean; error?: string; imported?: number; updated?: number }
        | undefined;
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
        const imported = resp.imported ?? 0;
        const updated = resp.updated ?? 0;
        const total = imported + updated;

        if (total > 0) {
          const parts = [];
          if (imported > 0) parts.push(`новых: ${imported}`);
          if (updated > 0) parts.push(`обновлено: ${updated}`);
          setSuccessMessage(
            `Успешно импортировано вакансий (${parts.join(", ")})`,
          );
        } else {
          setSuccessMessage("Импорт завершен");
        }

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
          <h2 className="text-base font-semibold leading-tight text-balance">
            {pageContext.isActive ? "Активные вакансии" : "Архивные вакансии"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Отметьте вакансии галочками на странице и загрузите выбранные в
            систему. Для импорта с нескольких страниц — перейдите на первую
            страницу списка.
          </p>
          {(selectedCount ?? 0) === 0 && !isImporting && (
            <output
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 block"
              aria-live="polite"
            >
              Выберите вакансии галочками на странице, затем нажмите кнопку
              импорта.
            </output>
          )}
        </div>
        <Button
          className="w-full tabular-nums"
          onClick={handleImportSelected}
          disabled={isImporting || (selectedCount ?? 0) === 0}
        >
          {isImporting
            ? "Импорт…"
            : `Загрузить выбранные (${selectedCount ?? 0})`}
        </Button>
        {successMessage && (
          <Alert
            variant="default"
            className="bg-green-50 text-green-900 border-green-200"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert
            variant="destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </Alert>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
