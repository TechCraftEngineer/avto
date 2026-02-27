import { API_URL } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { ExistingCandidateInfo, Organization, Workspace } from "../types";
import { Alert, Button } from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";

interface DuplicateCandidateViewProps {
  existingCandidate: ExistingCandidateInfo;
  vacancyId: string;
  selectedVacancyTitle: string;
  selectedOrgId: string | null;
  selectedWorkspaceId: string | null;
  organizations: Organization[];
  workspaces: Workspace[];
  userEmail: string | null;
  onLogout: () => void;
  authService: AuthService;
  setSelectedOrgId: (id: string | null) => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  isLoadingSettings: boolean;
  settingsError: string | null;
  onSettingsError: (err: string | null) => void;
  onTakeToVacancy: () => Promise<void>;
  onSaveWithoutVacancy: () => Promise<void>;
  onBack: () => void;
  error: string | null;
  successMessage: string | null;
  isProcessing: boolean;
}

export function DuplicateCandidateView({
  existingCandidate,
  vacancyId,
  selectedVacancyTitle,
  selectedOrgId,
  selectedWorkspaceId,
  organizations,
  workspaces,
  userEmail,
  onLogout,
  authService,
  setSelectedOrgId,
  setSelectedWorkspaceId,
  setWorkspaces,
  isLoadingSettings,
  settingsError,
  onSettingsError,
  onTakeToVacancy,
  onSaveWithoutVacancy,
  onBack,
  error,
  successMessage,
  isProcessing,
}: DuplicateCandidateViewProps) {
  const org = organizations.find((o) => o.id === selectedOrgId);
  const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const viewUrl =
    org?.slug && workspace?.slug
      ? `${API_URL}/orgs/${org.slug}/workspaces/${workspace.slug}/candidates`
      : null;

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
            Похожий кандидат уже есть в базе
          </h2>
          <p className="text-muted-foreground text-sm">
            Кандидат с такими контактами уже зарегистрирован в системе
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">
            {existingCandidate.fullName}
          </p>
          {existingCandidate.headline && (
            <p className="text-muted-foreground mt-0.5">
              {existingCandidate.headline}
            </p>
          )}
          {existingCandidate.email && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {existingCandidate.email}
            </p>
          )}
          {existingCandidate.phone && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {existingCandidate.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={onTakeToVacancy}
            disabled={isProcessing}
          >
            {isProcessing ? "Обработка…" : "Взять на вакансию"}
          </Button>
          {viewUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => chrome.tabs.create({ url: viewUrl })}
              disabled={isProcessing}
            >
              Посмотреть
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onSaveWithoutVacancy}
            disabled={isProcessing}
          >
            Сохранить без вакансии
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onBack}
            disabled={isProcessing}
          >
            Назад
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" role="status" aria-live="polite">
            {successMessage}
          </Alert>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
