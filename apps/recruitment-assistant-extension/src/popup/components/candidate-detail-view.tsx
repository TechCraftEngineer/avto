import { API_URL } from "../../config";
import type { AuthService } from "../../core/auth-service";
import type { ExistingCandidateInfo, Organization, Workspace } from "../types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "../ui";
import { AuthenticatedLayout } from "./authenticated-layout";

interface CandidateDetailViewProps {
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

const iconCls = "size-4 shrink-0 text-muted-foreground";

function IconMail() {
  return (
    <svg
      className={iconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <title>Email</title>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg
      className={iconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <title>Телефон</title>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-1.44 2.86L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.85-1.44 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      className={iconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <title>Пользователь</title>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      className={iconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <title>Локация</title>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      className={iconCls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <title>Внешняя ссылка</title>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function CandidateDetailView({
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
}: CandidateDetailViewProps) {
  const org = organizations.find((o) => o.id === selectedOrgId);
  const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const viewUrl =
    org?.slug && workspace?.slug
      ? `${API_URL}/orgs/${org.slug}/workspaces/${workspace.slug}/candidates?candidateId=${encodeURIComponent(existingCandidate.id)}`
      : null;

  const hasContacts =
    existingCandidate.email ||
    existingCandidate.phone ||
    existingCandidate.telegramUsername;

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
        {/* Header */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-1 w-fit text-muted-foreground hover:text-foreground"
            onClick={onBack}
            disabled={isProcessing}
          >
            ← Назад
          </Button>
          <h2 className="text-base font-semibold leading-tight">
            Карточка кандидата
          </h2>
          <p className="text-muted-foreground text-sm">
            Похожий кандидат найден в базе
          </p>
        </div>

        {/* Main card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">
                {existingCandidate.fullName}
              </CardTitle>
              {existingCandidate.headline && (
                <p className="text-muted-foreground text-sm font-normal">
                  {existingCandidate.headline}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {hasContacts && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Контакты
                  </h3>
                  <dl className="space-y-2.5">
                    {existingCandidate.email && (
                      <div className="flex items-center gap-2.5">
                        <IconMail />
                        <a
                          href={`mailto:${existingCandidate.email}`}
                          className="text-sm text-primary underline-offset-4 hover:underline break-all"
                        >
                          {existingCandidate.email}
                        </a>
                      </div>
                    )}
                    {existingCandidate.phone && (
                      <div className="flex items-center gap-2.5">
                        <IconPhone />
                        <a
                          href={`tel:${existingCandidate.phone}`}
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          {existingCandidate.phone}
                        </a>
                      </div>
                    )}
                    {existingCandidate.telegramUsername && (
                      <div className="flex items-center gap-2.5">
                        <IconUser />
                        <a
                          href={`https://t.me/${existingCandidate.telegramUsername.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          @
                          {existingCandidate.telegramUsername.replace(/^@/, "")}
                        </a>
                      </div>
                    )}
                  </dl>
                </div>
              </>
            )}
            {existingCandidate.location && (
              <>
                <Separator />
                <div className="flex items-center gap-2.5">
                  <IconMapPin />
                  <p className="text-sm text-muted-foreground">
                    {existingCandidate.location}
                  </p>
                </div>
              </>
            )}
            {existingCandidate.resumeUrl && (
              <>
                <Separator />
                <div className="flex items-center gap-2.5">
                  <IconExternalLink />
                  <a
                    href={existingCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Резюме
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Действия
          </h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={onTakeToVacancy}
              disabled={isProcessing || !vacancyId}
            >
              {isProcessing ? "Обработка…" : "Взять на вакансию"}
            </Button>
            {vacancyId && selectedVacancyTitle && (
              <p className="text-muted-foreground text-xs px-1">
                Вакансия: {selectedVacancyTitle}
              </p>
            )}
            {viewUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => chrome.tabs.create({ url: viewUrl })}
                disabled={isProcessing}
              >
                Открыть в приложении
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
          </div>
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
