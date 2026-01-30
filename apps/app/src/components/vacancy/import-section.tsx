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
import { useState } from "react";
import {
  fetchArchivedVacanciesList,
  triggerImportNewVacancies,
  triggerImportSelectedArchivedVacancies,
  triggerImportVacancyByUrl,
} from "~/actions/vacancy-import";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";
import { ArchivedVacanciesSelector } from "./archived-vacancies-selector";
import { ImportProgress } from "./import-progress";

export function VacancyImportSection() {
  const { workspace } = useWorkspace();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();
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
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Проверяем наличие активной интеграции с HH
  const hhIntegration = integrations?.find(
    (int) => int.type === "hh" && int.isActive,
  );
  const hasActiveHHIntegration = !!hhIntegration;

  // Progress tracking states - теперь храним только run IDs
  const [newVacanciesRunId, setNewVacanciesRunId] = useState<string | null>(
    null,
  );
  const [archivedVacanciesRunId, setArchivedVacanciesRunId] = useState<
    string | null
  >(null);
  const [byUrlRunId, setByUrlRunId] = useState<string | null>(null);

  const [isImportingNew, setIsImportingNew] = useState(false);
  const [isImportingArchived, setIsImportingArchived] = useState(false);
  const [isImportingByUrl, setIsImportingByUrl] = useState(false);

  const handleImportNew = async () => {
    if (!workspace?.id) return;

    setIsConfirmNewDialogOpen(false);

    try {
      setIsImportingNew(true);
      const runId = await triggerImportNewVacancies(workspace.id);
      setNewVacanciesRunId(runId);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setNewVacanciesRunId(null);
      setIsImportingNew(false);
    }
  };

  const handleImportArchived = async () => {
    if (!workspace?.id) return;

    setIsConfirmArchivedDialogOpen(false);

    try {
      setIsSelectingArchivedVacancies(true);

      // Запускаем получение списка вакансий
      const requestId = await fetchArchivedVacanciesList(workspace.id);
      setArchivedListRequestId(requestId);
    } catch (error) {
      console.error("Ошибка получения списка архивных вакансий:", error);
      setIsSelectingArchivedVacancies(false);
      setArchivedListRequestId(null);
    }
  };

  const handleArchivedVacanciesSelected = async (selectedIds: string[]) => {
    if (!workspace?.id) return;

    setIsSelectingArchivedVacancies(false);
    setArchivedListRequestId(null);

    try {
      setIsImportingArchived(true);
      const runId = await triggerImportSelectedArchivedVacancies(
        workspace.id,
        selectedIds,
      );
      setArchivedVacanciesRunId(runId);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setArchivedVacanciesRunId(null);
      setIsImportingArchived(false);
    }
  };

  const handleArchivedVacanciesCancel = () => {
    setIsSelectingArchivedVacancies(false);
    setArchivedListRequestId(null);
  };

  const handleImportByUrl = async () => {
    if (!workspace?.id) return;

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
      setIsImportingByUrl(true);
      setIsUrlDialogOpen(false);
      setUrlError("");

      const runId = await triggerImportVacancyByUrl(workspace.id, vacancyUrl);
      setByUrlRunId(runId);

      setVacancyUrl("");
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingByUrl(false);
    }
  };

  const handleNewVacanciesComplete = () => {
    setIsImportingNew(false);
    setNewVacanciesRunId(null);
  };

  const handleArchivedVacanciesComplete = () => {
    setIsImportingArchived(false);
    setArchivedVacanciesRunId(null);
  };

  const handleByUrlComplete = () => {
    setIsImportingByUrl(false);
    setByUrlRunId(null);
  };

  // Показываем предупреждение, если нет активной интеграции
  if (!isLoadingIntegrations && !hasActiveHHIntegration) {
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
              disabled={isImportingNew || !workspace?.id}
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
                !workspace?.id
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Загрузить архивные вакансии
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUrlDialogOpen(true)}
              disabled={isImportingByUrl || !workspace?.id}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Добавить вакансию по ссылке
            </Button>
          </div>

          {/* Selector for archived vacancies */}
          {isSelectingArchivedVacancies &&
            archivedListRequestId &&
            workspace?.id && (
              <ArchivedVacanciesSelector
                workspaceId={workspace.id}
                requestId={archivedListRequestId}
                onSelect={handleArchivedVacanciesSelected}
                onCancel={handleArchivedVacanciesCancel}
              />
            )}

          {/* Progress indicators */}
          {isImportingNew && newVacanciesRunId && workspace?.id && (
            <ImportProgress
              type="new"
              workspaceId={workspace.id}
              runId={newVacanciesRunId}
              onComplete={handleNewVacanciesComplete}
            />
          )}

          {isImportingArchived && archivedVacanciesRunId && workspace?.id && (
            <ImportProgress
              type="archived"
              workspaceId={workspace.id}
              runId={archivedVacanciesRunId}
              onComplete={handleArchivedVacanciesComplete}
            />
          )}

          {isImportingByUrl && byUrlRunId && workspace?.id && (
            <ImportProgress
              type="by-url"
              workspaceId={workspace.id}
              runId={byUrlRunId}
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
