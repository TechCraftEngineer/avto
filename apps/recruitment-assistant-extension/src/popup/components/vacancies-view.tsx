import { useEffect, useState } from "react";
import type { AuthService } from "../../core/auth-service";
import { IMPORT_PROGRESS_KEY } from "../../shared/import-progress";
import type { Organization, PageContext, Workspace } from "../types";
import { Alert, Button, Hint } from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";

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
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isImporting) return;
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === "local" && changes[IMPORT_PROGRESS_KEY]) {
        const val = changes[IMPORT_PROGRESS_KEY].newValue as
          | { message?: string }
          | undefined;
        setProgressMessage(val?.message ?? null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
      setProgressMessage(null);
    };
  }, [isImporting]);

  const handleImportSelected = async () => {
    setError(null);
    setSuccessMessage(null);
    setProgressMessage(null);
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
            систему.
          </p>
        </div>
        {(selectedCount ?? 0) === 0 && !isImporting ? (
          <Hint className="border-amber-200 bg-amber-50/80 text-amber-900">
            <span className="block">
              <strong>Шаг 1.</strong> Отметьте галочками нужные вакансии на
              странице.
            </span>
            <span className="block mt-1">
              <strong>Шаг 2.</strong> Нажмите «Загрузить выбранные» — в систему
              попадут только вакансии с текущей страницы.
            </span>
          </Hint>
        ) : (
          <Hint>
            Выбрано {selectedCount ?? 0} вакансий на текущей странице. Нажмите
            кнопку ниже для загрузки.
          </Hint>
        )}
        <div className="flex justify-center">
          <Button
            className="w-fit tabular-nums"
            onClick={handleImportSelected}
            disabled={isImporting || (selectedCount ?? 0) === 0}
          >
            {isImporting
              ? "Импорт…"
              : `Загрузить выбранные (${selectedCount ?? 0})`}
          </Button>
        </div>
        {isImporting && progressMessage && (
          <output className="text-muted-foreground text-sm" aria-live="polite">
            {progressMessage}
          </output>
        )}
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
          <Alert variant="destructive" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
