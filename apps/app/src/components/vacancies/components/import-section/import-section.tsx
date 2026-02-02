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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@qbs-autonaim/ui";
import { ImportByUrlSchema } from "@qbs-autonaim/validators";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import NextLink from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  fetchArchivedVacanciesList,
  triggerImportNewVacancies,
  triggerImportSelectedArchivedVacancies,
  triggerImportVacancyByUrl,
} from "~/actions/vacancy-import";
import { ImportArchivedProgress } from "~/components/vacancy/components/import/import-archived-progress";
import { ImportByUrlProgress } from "~/components/vacancy/components/import/import-by-url-progress";
import { ImportNewProgress } from "~/components/vacancy/components/import/import-new-progress";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";
import { ArchivedVacanciesSelector } from "../archived-vacancies-selector";

export function VacancyImportSection() {
  const { workspace } = useWorkspace();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();

  // Мемоизируем workspaceId, чтобы избежать ререндеров дочерних компонентов
  const workspaceId = useMemo(() => workspace?.id ?? "", [workspace?.id]);

  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isConfirmNewDialogOpen, setIsConfirmNewDialogOpen] = useState(false);
  const [isConfirmArchivedDialogOpen, setIsConfirmArchivedDialogOpen] =
    useState(false);
  const [isSelectingArchivedVacancies, setIsSelectingArchivedVacancies] =
    useState(false);
  const [archivedListRequestId, setArchivedListRequestId] = useState<
    string | null
  >(null);
  const [vacancyUrl, setVacancyUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...trpc.integration.list.queryOptions({
      workspaceId,
    }),
    enabled: !!workspaceId,
  });

  // Проверяем наличие активной интеграции с HH
  const hhIntegration = integrations?.find(
    (int) => int.type === "hh" && int.isActive,
  );
  const hasActiveHHIntegration = !!hhIntegration;

  // Progress tracking states
  const [isImportingNew, setIsImportingNew] = useState(false);
  const [isImportingArchived, setIsImportingArchived] = useState(false);
  const [isImportingByUrl, setIsImportingByUrl] = useState(false);
  const [byUrlRequestId, setByUrlRequestId] = useState<string | null>(null);

  const handleImportNew = async () => {
    if (!workspaceId) return;

    setIsConfirmNewDialogOpen(false);

    try {
      setIsImportingNew(true);
      await triggerImportNewVacancies(workspaceId);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingNew(false);
    }
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
  }, []);

  const handleArchivedVacanciesComplete = useCallback(() => {
    setIsImportingArchived(false);
  }, []);

  const handleByUrlComplete = useCallback(() => {
    setIsImportingByUrl(false);
    setByUrlRequestId(null);
  }, []);

  // Показываем скелетон во время загрузки
  if (isLoadingIntegrations || !workspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт вакансий</CardTitle>
          <CardDescription>
            Загрузите вакансии из HeadHunter в систему
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

  // Показываем предупреждение, если нет активной интеграции
  if (!hasActiveHHIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт вакансий</CardTitle>
          <CardDescription>
            Загрузите вакансии из HeadHunter в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Интеграция с HeadHunter не настроена</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Для импорта вакансий необходимо настроить интеграцию с
                HeadHunter. Это позволит системе автоматически загружать
                вакансии и отслеживать отклики.
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
          <CardTitle>Импорт вакансий</CardTitle>
          <CardDescription>
            Загрузите вакансии из HeadHunter в систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsConfirmNewDialogOpen(true)}
              disabled={isImportingNew || !workspaceId}
            >
              <Download className="h-4 w-4 mr-2" />
              Загрузить активные вакансии
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmArchivedDialogOpen(true)}
              disabled={
                isImportingArchived ||
                isSelectingArchivedVacancies ||
                !workspaceId
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Загрузить архивные вакансии
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUrlDialogOpen(true)}
              disabled={isImportingByUrl || !workspaceId}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Добавить вакансию по ссылке
            </Button>
          </div>

          {/* Selector for archived vacancies - показываем только если не идет импорт */}
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

      {/* Confirm New Vacancies Dialog */}
      <Dialog
        open={isConfirmNewDialogOpen}
        onOpenChange={setIsConfirmNewDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение импорта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите запустить импорт активных вакансий?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Эта операция может занять продолжительное время и загрузить
              большое количество данных из HeadHunter.
            </p>
            <p className="text-sm text-muted-foreground">
              Рекомендуется запускать импорт только при необходимости обновления
              списка вакансий.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmNewDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={handleImportNew}>Запустить импорт</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Archived Vacancies Dialog */}
      <Dialog
        open={isConfirmArchivedDialogOpen}
        onOpenChange={setIsConfirmArchivedDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбор архивных вакансий</DialogTitle>
            <DialogDescription>
              Сейчас будет загружен список архивных вакансий для выбора
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Система загрузит список ваших архивных вакансий с HeadHunter, и вы
              сможете выбрать, какие из них импортировать.
            </p>
            <p className="text-sm text-muted-foreground">
              Это позволит избежать загрузки ненужных данных и сэкономит время.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmArchivedDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={handleImportArchived}>Продолжить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Input Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить вакансию по ссылке</DialogTitle>
            <DialogDescription>
              Введите ссылку на вакансию с HeadHunter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vacancy-url">Ссылка на вакансию</Label>
              <Input
                id="vacancy-url"
                placeholder="https://hh.ru/vacancy/12345678"
                value={vacancyUrl}
                onChange={(e) => {
                  setVacancyUrl(e.target.value);
                  setUrlError("");
                }}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUrlDialogOpen(false);
                setVacancyUrl("");
                setUrlError("");
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleImportByUrl}>Импортировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
