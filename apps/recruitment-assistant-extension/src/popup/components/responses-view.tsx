import { useEffect, useState } from "react";
import type { AuthService } from "../../core/auth-service";
import { IMPORT_PROGRESS_KEY } from "../../shared/import-progress";
import type { Organization, Workspace } from "../types";
import { Alert, Button, Hint } from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";

interface ResponsesViewProps {
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

export function ResponsesView({
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
}: ResponsesViewProps) {
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

  const handleImportResponses = async () => {
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
        | { ok?: boolean; error?: string; responsesImported?: number }
        | undefined;
      try {
        resp = await chrome.tabs.sendMessage(tab.id, {
          type: "IMPORT_RESPONSES",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("Receiving end") ||
          msg.includes("Could not establish connection")
        ) {
          resp = await chrome.runtime.sendMessage({
            type: "EXECUTE_IMPORT_RESPONSES",
            payload: { tabId: tab.id },
          });
        } else {
          throw e;
        }
      }

      if (resp?.ok === false) {
        setError(resp.error ?? "Ошибка импорта");
      } else if (resp?.ok === true) {
        const count = resp.responsesImported ?? 0;
        setSuccessMessage(`Успешно импортировано откликов: ${count}`);
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
            Отклики по вакансии
          </h2>
          <p className="text-muted-foreground text-sm">
            Импортируйте отклики кандидатов в систему
          </p>
        </div>
        <Hint>
          Импортируются кандидаты из списка откликов — они появятся в системе
          как соискатели.
        </Hint>
        <div className="flex justify-center">
          <Button
            className="w-fit"
            onClick={handleImportResponses}
            disabled={isImporting}
          >
            {isImporting ? "Импорт…" : "Импортировать отклики"}
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
