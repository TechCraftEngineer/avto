"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { ImportByUrlSchema } from "@qbs-autonaim/validators";
import { AlertCircle, Settings } from "lucide-react";
import NextLink from "next/link";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  fetchActiveVacanciesList,
  fetchArchivedVacanciesList,
  triggerImportSelectedActiveVacancies,
  triggerImportSelectedArchivedVacancies,
  triggerImportVacancyByUrl,
} from "~/actions/vacancy-import";
import { ImportArchivedProgress } from "~/components/vacancy/components/import/import-archived-progress";
import { ImportByUrlProgress } from "~/components/vacancy/components/import/import-by-url-progress";
import { ImportNewProgress } from "~/components/vacancy/components/import/import-new-progress";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { ActiveVacanciesSelector } from "../active-vacancies-selector";
import { ArchivedVacanciesSelector } from "../archived-vacancies-selector";
import { ImportActions } from "./import-actions";
import { ImportDialogs } from "./import-dialogs";
import { PlatformSelector } from "./platform-selector";
import { useImportState } from "./use-import-state";
import { usePlatformIntegration } from "./use-platform-integration";

export function VacancyImportSection() {
  const { workspace } = useWorkspace();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();

  // Мемоизируем workspaceId, чтобы избежать ререндеров дочерних компонентов
  const workspaceId = useMemo(() => workspace?.id ?? "", [workspace?.id]);

  // Используем хуки для управления состоянием
  const importState = useImportState();
  const platformIntegration = usePlatformIntegration(workspaceId);

  const {
    isLoadingIntegrations,
    activeIntegrations,
    selectedPlatform,
    setSelectedPlatform,
    currentIntegration,
    hasActiveIntegrations,
    getPlatformName,
  } = platformIntegration;

  const {
    isUrlDialogOpen,
    setIsUrlDialogOpen,
    isConfirmNewDialogOpen,
    setIsConfirmNewDialogOpen,
    isConfirmArchivedDialogOpen,
    setIsConfirmArchivedDialogOpen,
    isImportingNew,
    setIsImportingNew,
    isImportingArchived,
    setIsImportingArchived,
    isImportingByUrl,
    setIsImportingByUrl,
    isSelectingActiveVacancies,
    setIsSelectingActiveVacancies,
    activeListRequestId,
    setActiveListRequestId,
    isSelectingArchivedVacancies,
    setIsSelectingArchivedVacancies,
    archivedListRequestId,
    setArchivedListRequestId,
    vacancyUrl,
    setVacancyUrl,
    urlError,
    setUrlError,
    byUrlRequestId,
    setByUrlRequestId,
  } = importState;

  const handleImportNew = async () => {
    if (!workspaceId) return;

    setIsConfirmNewDialogOpen(false);

    try {
      setIsSelectingActiveVacancies(true);
      const requestId = await fetchActiveVacanciesList(workspaceId);
      setActiveListRequestId(requestId);
    } catch (error) {
      console.error("Ошибка получения списка активных вакансий:", error);
      toast.error(
        "Не удалось получить список активных вакансий. Попробуйте позже.",
      );
      setIsSelectingActiveVacancies(false);
      setActiveListRequestId(null);
    }
  };

  const handleActiveVacanciesSelected = async (
    selectedIds: string[],
    vacancies: Array<{
      id: string;
      title: string;
      region?: string;
    }>,
  ) => {
    if (!workspaceId) return;

    setIsSelectingActiveVacancies(false);
    setActiveListRequestId(null);

    if (selectedIds.length === 0) {
      return;
    }

    try {
      setIsImportingNew(true);
      const vacanciesWithUrls = vacancies.map((v) => ({
        ...v,
        url: `https://hh.ru/vacancy/${v.id}`,
      }));
      await triggerImportSelectedActiveVacancies(
        workspaceId,
        selectedIds,
        vacanciesWithUrls,
      );
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingNew(false);
    }
  };

  const handleActiveVacanciesCancel = () => {
    setIsSelectingActiveVacancies(false);
    setActiveListRequestId(null);
  };

  const handleImportArchived = async () => {
    if (!workspaceId) return;

    setIsConfirmArchivedDialogOpen(false);

    try {
      setIsSelectingArchivedVacancies(true);

      // Запускаем получение списка вакансий
      const requestId = await fetchArchivedVacanciesList(workspaceId);
      setArchivedListRequestId(requestId);
    } catch (error) {
      console.error("Ошибка получения списка архивных вакансий:", error);
      toast.error(
        "Не удалось получить список архивных вакансий. Попробуйте позже.",
      );
      setIsSelectingArchivedVacancies(false);
      setArchivedListRequestId(null);
    }
  };

  const handleArchivedVacanciesSelected = async (
    selectedIds: string[],
    vacancies: Array<{
      id: string;
      title: string;
      region?: string;
      workLocation?: string;
      archivedAt?: string;
    }>,
  ) => {
    if (!workspaceId) return;

    setIsSelectingArchivedVacancies(false);
    setArchivedListRequestId(null);

    if (selectedIds.length === 0) {
      return;
    }

    try {
      setIsImportingArchived(true);

      // Добавляем URL к каждой вакансии
      const vacanciesWithUrls = vacancies.map((v) => ({
        ...v,
        url: `https://hh.ru/vacancy/${v.id}`,
      }));

      await triggerImportSelectedArchivedVacancies(
        workspaceId,
        selectedIds,
        vacanciesWithUrls,
      );
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingArchived(false);
    }
  };

  const handleArchivedVacanciesCancel = () => {
    setIsSelectingArchivedVacancies(false);
    setArchivedListRequestId(null);
  };

  const handleImportByUrl = async () => {
    if (!workspaceId) return;

    // Валидация URL через Zod схему
    const validationResult = ImportByUrlSchema.safeParse({ url: vacancyUrl });

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Введите корректную ссылку на вакансию";
      setUrlError(errorMessage);
      return;
    }

    try {
      const requestId = crypto.randomUUID();
      setByUrlRequestId(requestId);
      setIsImportingByUrl(true);
      setIsUrlDialogOpen(false);
      setUrlError("");

      await triggerImportVacancyByUrl(workspaceId, vacancyUrl, requestId);

      setVacancyUrl("");
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingByUrl(false);
      setByUrlRequestId(null);
    }
  };

  const handleNewVacanciesComplete = useCallback(() => {
    setIsImportingNew(false);
  }, [setIsImportingNew]);

  const handleArchivedVacanciesComplete = useCallback(() => {
    setIsImportingArchived(false);
  }, [setIsImportingArchived]);

  const handleByUrlComplete = useCallback(() => {
    setIsImportingByUrl(false);
    setByUrlRequestId(null);
  }, [setIsImportingByUrl, setByUrlRequestId]);

  // Показываем скелетон во время загрузки
  if (isLoadingIntegrations || !workspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт вакансий</CardTitle>
          <CardDescription>
            Загрузите вакансии из подключенных платформ в систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-[240px] bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-[240px] bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-[240px] bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Показываем предупреждение, если нет активных интеграций
  if (!hasActiveIntegrations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт вакансий</CardTitle>
          <CardDescription>
            Загрузите вакансии из подключенных платформ в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Интеграция не настроена</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Для импорта вакансий необходимо настроить интеграцию с
                платформой подбора персонала. Это позволит системе автоматически
                загружать вакансии и отслеживать отклики.
              </p>
              <Button asChild variant="outline" size="sm">
                <NextLink
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Настроить интеграцию
                </NextLink>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Импорт вакансий</CardTitle>
              <CardDescription>
                Загрузите вакансии из подключенных платформ в систему
              </CardDescription>
            </div>
            <PlatformSelector
              activeIntegrations={activeIntegrations}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              getPlatformName={getPlatformName}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImportActions
            workspaceId={workspaceId}
            hasCurrentIntegration={!!currentIntegration}
            hasMultipleIntegrations={activeIntegrations.length > 1}
            isImportingNew={isImportingNew}
            isImportingArchived={isImportingArchived}
            isSelectingActiveVacancies={isSelectingActiveVacancies}
            isSelectingArchivedVacancies={isSelectingArchivedVacancies}
            isImportingByUrl={isImportingByUrl}
            onImportNew={() => setIsConfirmNewDialogOpen(true)}
            onImportArchived={() => setIsConfirmArchivedDialogOpen(true)}
            onImportByUrl={() => setIsUrlDialogOpen(true)}
          />

          {/* Selector for active vacancies */}
          {isSelectingActiveVacancies &&
            activeListRequestId &&
            workspaceId &&
            !isImportingNew && (
              <ActiveVacanciesSelector
                workspaceId={workspaceId}
                requestId={activeListRequestId}
                onSelect={handleActiveVacanciesSelected}
                onCancel={handleActiveVacanciesCancel}
              />
            )}

          {/* Selector for archived vacancies */}
          {isSelectingArchivedVacancies &&
            archivedListRequestId &&
            workspaceId &&
            !isImportingArchived && (
              <ArchivedVacanciesSelector
                workspaceId={workspaceId}
                requestId={archivedListRequestId}
                onSelect={handleArchivedVacanciesSelected}
                onCancel={handleArchivedVacanciesCancel}
              />
            )}

          {/* Progress indicators */}
          {isImportingNew && workspaceId && (
            <ImportNewProgress
              workspaceId={workspaceId}
              onComplete={handleNewVacanciesComplete}
            />
          )}

          {isImportingArchived && workspaceId && (
            <ImportArchivedProgress
              workspaceId={workspaceId}
              onComplete={handleArchivedVacanciesComplete}
            />
          )}

          {isImportingByUrl && byUrlRequestId && workspaceId && (
            <ImportByUrlProgress
              workspaceId={workspaceId}
              requestId={byUrlRequestId}
              onComplete={handleByUrlComplete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ImportDialogs
        isConfirmNewDialogOpen={isConfirmNewDialogOpen}
        onConfirmNewDialogChange={setIsConfirmNewDialogOpen}
        onConfirmNew={handleImportNew}
        currentPlatformName={
          currentIntegration
            ? getPlatformName(currentIntegration.type)
            : undefined
        }
        isConfirmArchivedDialogOpen={isConfirmArchivedDialogOpen}
        onConfirmArchivedDialogChange={setIsConfirmArchivedDialogOpen}
        onConfirmArchived={handleImportArchived}
        isUrlDialogOpen={isUrlDialogOpen}
        onUrlDialogChange={setIsUrlDialogOpen}
        vacancyUrl={vacancyUrl}
        onVacancyUrlChange={setVacancyUrl}
        urlError={urlError}
        onUrlErrorChange={setUrlError}
        onConfirmUrl={handleImportByUrl}
      />
    </>
  );
}
