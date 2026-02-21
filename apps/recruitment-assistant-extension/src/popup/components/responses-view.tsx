import { useState } from "react";
import type { Organization, Workspace } from "../types";
import type { AuthService } from "../../core/auth-service";
import { AuthenticatedLayout } from "./authenticated-layout";
import { Alert, Button } from "../ui";

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

  const handleImportResponses = async () => {
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
        <Button
          className="w-full"
          onClick={handleImportResponses}
          disabled={isImporting}
        >
          {isImporting ? "Импорт…" : "Импортировать отклики"}
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
