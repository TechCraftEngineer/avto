import { useEffect, useState } from "react";
import { z } from "zod";
import { getExtensionApiUrl } from "../../config";
import type { AuthService } from "../../core/auth-service";
import { isValidHttpUrl } from "../../shared/utils";
import type {
  ExistingCandidateInfo,
  Organization,
  PageContext,
  Workspace,
} from "../types";
import { Alert, Button, Hint, Label, Select } from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";
import { CandidateDetailView } from "./candidate-detail-view";

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

const ExistingCandidateSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  resumeUrl: z.string().nullable().optional(),
});

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successResponseUrl, setSuccessResponseUrl] = useState<string | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [duplicateState, setDuplicateState] = useState<{
    existingCandidate: ExistingCandidateInfo;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingToGlobal, setIsSavingToGlobal] = useState(false);
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

  const sendToTab = async (
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string; responseUrl?: string }> => {
    setError(null);
    setSuccessMessage(null);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      setError("Вкладка не найдена");
      return {
        ok: false as const,
        error: "Вкладка не найдена",
        responseUrl: undefined,
      };
    }
    try {
      let resp:
        | { ok?: boolean; error?: string; responseUrl?: string }
        | undefined;
      try {
        resp = await chrome.tabs.sendMessage(tab.id, { type, payload });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const isConnectionError =
          msg.includes("Receiving end") ||
          msg.includes("Could not establish connection");
        if (
          isConnectionError &&
          (type === "IMPORT_TO_SYSTEM" ||
            type === "CHECK_AND_IMPORT" ||
            type === "CHECK_AND_SAVE_TO_GLOBAL")
        ) {
          const fallbackType =
            type === "CHECK_AND_SAVE_TO_GLOBAL"
              ? "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL"
              : "EXECUTE_IMPORT_TO_SYSTEM";
          resp = await chrome.runtime.sendMessage({
            type: fallbackType,
            payload: {
              tabId: tab.id,
              vacancyId: payload?.vacancyId,
              workspaceId: payload?.workspaceId,
            },
          });
        } else if (isConnectionError) {
          setError("Обновите страницу и попробуйте снова");
          return {
            ok: false as const,
            error: "Нет связи с вкладкой",
            responseUrl: undefined,
          };
        } else {
          throw e;
        }
      }
      return resp as { ok: boolean; error?: string; responseUrl?: string };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return { ok: false as const, error: msg, responseUrl: undefined };
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
    setSuccessMessage(null);
    setSuccessResponseUrl(null);
    setDuplicateState(null);
    const resp = await sendToTab("CHECK_AND_IMPORT", {
      vacancyId: selectedVacancyId,
    });
    if (
      resp?.ok === true &&
      "duplicate" in resp &&
      resp.duplicate &&
      "existingCandidate" in resp &&
      resp.existingCandidate
    ) {
      const parsed = ExistingCandidateSchema.safeParse(resp.existingCandidate);
      if (parsed.success) {
        setDuplicateState({ existingCandidate: parsed.data });
      } else {
        setError("Некорректные данные кандидата");
      }
    } else if (resp?.ok === false) {
      setError(resp.error ?? "Ошибка импорта");
    } else if (resp?.ok === true) {
      setSuccessMessage("Резюме успешно добавлено в вакансию");
      setSuccessResponseUrl(
        isValidHttpUrl(resp?.responseUrl) ? resp.responseUrl : null,
      );
    }
    setIsImporting(false);
  };

  const handleTakeToVacancy = async () => {
    if (!duplicateState || !selectedVacancyId || !selectedWorkspaceId) return;
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setSuccessResponseUrl(null);
    const resp = await sendToTab("IMPORT_TO_VACANCY_EXISTING", {
      vacancyId: selectedVacancyId,
      globalCandidateId: duplicateState.existingCandidate.id,
    });
    if (resp?.ok === false) {
      setError(resp.error ?? "Ошибка");
    } else {
      setSuccessMessage("Кандидат добавлен на вакансию");
      setSuccessResponseUrl(
        isValidHttpUrl(resp?.responseUrl) ? resp.responseUrl : null,
      );
      setDuplicateState(null);
    }
    setIsProcessing(false);
  };

  const handleSaveToGlobalOnly = async () => {
    if (!selectedWorkspaceId) {
      setError("Выберите рабочее пространство");
      return;
    }
    setSuccessResponseUrl(null);
    setIsSavingToGlobal(true);
    setError(null);
    setSuccessMessage(null);
    setDuplicateState(null);
    const resp = await sendToTab("CHECK_AND_SAVE_TO_GLOBAL", {
      workspaceId: selectedWorkspaceId,
    });
    if (
      resp?.ok === true &&
      "duplicate" in resp &&
      resp.duplicate &&
      "existingCandidate" in resp &&
      resp.existingCandidate
    ) {
      const parsed = ExistingCandidateSchema.safeParse(resp.existingCandidate);
      if (parsed.success) {
        setDuplicateState({ existingCandidate: parsed.data });
      } else {
        setError("Некорректные данные кандидата");
      }
    } else if (resp?.ok === false) {
      setError(resp.error ?? "Ошибка");
    } else if (resp?.ok === true) {
      setSuccessMessage("Кандидат сохранён в базу без привязки к вакансии");
    }
    setIsSavingToGlobal(false);
  };

  const handleSaveWithoutVacancy = async () => {
    if (!duplicateState || !selectedWorkspaceId) return;
    setSuccessResponseUrl(null);
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    const platformSource =
      pageContext.platform === "HeadHunter" ? "HH" : "WEB_LINK";
    const resp = await sendToTab("SAVE_TO_GLOBAL_EXISTING", {
      globalCandidateId: duplicateState.existingCandidate.id,
      workspaceId: selectedWorkspaceId,
      platformSource,
    });
    if (resp?.ok === false) {
      setError(resp.error ?? "Ошибка");
    } else {
      setSuccessMessage("Кандидат сохранён в базу без привязки к вакансии");
      setDuplicateState(null);
    }
    setIsProcessing(false);
  };

  const isHeadHunter = pageContext.platform === "HeadHunter";
  const selectedVacancy = vacancies.find((v) => v.id === selectedVacancyId);

  if (duplicateState) {
    return (
      <CandidateDetailView
        existingCandidate={duplicateState.existingCandidate}
        vacancyId={selectedVacancyId}
        selectedVacancyTitle={selectedVacancy?.title ?? ""}
        selectedOrgId={selectedOrgId}
        selectedWorkspaceId={selectedWorkspaceId}
        organizations={organizations}
        workspaces={workspaces}
        userEmail={userEmail}
        onLogout={onLogout}
        authService={authService}
        setSelectedOrgId={setSelectedOrgId}
        setSelectedWorkspaceId={setSelectedWorkspaceId}
        setWorkspaces={setWorkspaces}
        isLoadingSettings={isLoadingSettings}
        settingsError={settingsError}
        onSettingsError={onSettingsError}
        onTakeToVacancy={handleTakeToVacancy}
        onSaveWithoutVacancy={handleSaveWithoutVacancy}
        onBack={() => setDuplicateState(null)}
        error={error}
        successMessage={successMessage}
        isProcessing={isProcessing}
      />
    );
  }

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
                isImporting ||
                vacancies.length === 0 ||
                !selectedVacancyId ||
                isSavingToGlobal
              }
            >
              {isImporting ? "Импорт…" : "Импортировать"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSaveToGlobalOnly}
              disabled={isImporting || isSavingToGlobal || !selectedWorkspaceId}
            >
              {isSavingToGlobal
                ? "Сохранение…"
                : "Сохранить в базу (без вакансии)"}
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" role="status" aria-live="polite">
            <span className="block mb-2">{successMessage}</span>
            {successResponseUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => chrome.tabs.create({ url: successResponseUrl })}
              >
                Посмотреть
              </Button>
            )}
          </Alert>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
