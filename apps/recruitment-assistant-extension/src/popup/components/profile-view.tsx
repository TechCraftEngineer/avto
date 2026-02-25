import { useEffect, useState } from "react";
import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { Organization, PageContext, Workspace } from "../types";
import { Alert, Button, Hint, Label, Select } from "../ui";
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
  const [isImporting, setIsImporting] = useState(false);
  const [vacancies, setVacancies] = useState<
    Array<{ id: string; title: string; isFavorite: boolean }>
  >([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("");
  const [isLoadingVacancies, setIsLoadingVacancies] = useState(false);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setVacancies([]);
      setSelectedVacancyId("");
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoadingVacancies(true);
      try {
        const token = await authService.getToken();
        if (!token) return;
        const resp = await chrome.runtime.sendMessage({
          type: "API_REQUEST",
          payload: {
            url: getExtensionApiUrl(
              `vacancies?workspaceId=${encodeURIComponent(selectedWorkspaceId)}`,
            ),
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        });
        if (!cancelled && resp?.success && Array.isArray(resp.data)) {
          setVacancies(resp.data);
          setSelectedVacancyId((prev) =>
            resp.data.length > 0 &&
            !resp.data.some((v: { id: string }) => v.id === prev)
              ? resp.data[0].id
              : prev,
          );
        }
      } catch {
        if (!cancelled) setVacancies([]);
      } finally {
        if (!cancelled) setIsLoadingVacancies(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId, authService]);

  const sendToTab = async (type: string, payload?: { vacancyId?: string }) => {
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
      const resp = await chrome.tabs.sendMessage(tab.id, { type, payload });
      return resp as { ok: boolean; error?: string };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return { ok: false as const, error: msg };
    }
  };

  const handleImport = async () => {
    if (vacancies.length > 0 && !selectedVacancyId) {
      setError("Выберите вакансию для импорта");
      return;
    }
    if (vacancies.length === 0) {
      setError(
        "Нет вакансий. Сначала сохраните настройки и создайте вакансии в workspace.",
      );
      return;
    }
    setIsImporting(true);
    setError(null);
    const resp = await sendToTab("IMPORT_TO_SYSTEM", {
      vacancyId: selectedVacancyId || undefined,
    });
    if (resp?.ok === false) setError(resp.error ?? "Ошибка импорта");
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
              ? "Импортируйте данные кандидата в систему"
              : "Импортируйте данные профиля в систему"}
          </p>
        </div>
        <Hint icon="steps">
          <span className="block">
            Нажмите «Импортировать» — данные будут извлечены со страницы и
            добавлены в выбранную вакансию.
          </span>
        </Hint>
        <div className="flex flex-col gap-2">
          {selectedWorkspaceId && (
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-select" className="text-xs">
                Вакансия для импорта
              </Label>
              <Select
                id="vacancy-select"
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                disabled={isLoadingVacancies}
              >
                <option value="">
                  {isLoadingVacancies ? "Загрузка…" : "Выберите вакансию"}
                </option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.isFavorite ? "★ " : ""}
                    {v.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleImport}
              disabled={
                isImporting || vacancies.length === 0 || !selectedVacancyId
              }
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
