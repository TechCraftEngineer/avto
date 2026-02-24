import { useState } from "react";
import type { AuthService } from "../../core/auth-service";
import type { Organization, PageContext, Workspace } from "../types";
import { Alert, Button, Hint } from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";

interface ProfileViewProps {
  pageContext: Extract<PageContext, { type: "profile" }>;
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

export function ProfileView({
  pageContext,
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
}: ProfileViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const sendToTab = async (type: string) => {
    setError(null);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      setError("Вкладка не найдена");
      return { ok: false as const, error: "Вкладка не найдена" };
    }
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { type });
      return resp as { ok: boolean; error?: string };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return { ok: false as const, error: msg };
    }
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    const resp = await sendToTab("EXTRACT_DATA");
    if (resp?.ok === false) setError(resp.error ?? "Ошибка извлечения");
    setIsExtracting(false);
  };

  const handleExportClipboard = async () => {
    setIsExporting(true);
    await sendToTab("EXPORT_CLIPBOARD");
    setIsExporting(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    await sendToTab("IMPORT_TO_SYSTEM");
    setIsImporting(false);
  };

  const isHeadHunter = pageContext.platform === "HeadHunter";

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
            {isHeadHunter ? "Страница резюме" : "Профиль LinkedIn"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isHeadHunter
              ? "Извлеките данные кандидата и импортируйте в систему"
              : "Извлеките данные профиля и импортируйте в систему"}
          </p>
        </div>
        <Hint icon="steps">
          <span className="block">
            <strong>Шаг 1.</strong> «Извлечь данные» — на странице появится
            панель с данными.
          </span>
          <span className="mt-1 block">
            <strong>Шаг 2.</strong> «Импортировать» — добавить в систему, или
            «Копировать» — в буфер обмена.
          </span>
        </Hint>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={handleExtract}
            disabled={isExtracting}
          >
            {isExtracting ? "Извлечение…" : "Извлечь данные"}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleExportClipboard}
              disabled={isExporting}
            >
              {isExporting ? "…" : "Копировать"}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? "Импорт…" : "Импортировать"}
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
