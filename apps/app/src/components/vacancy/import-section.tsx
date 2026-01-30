"use client";

import type { Realtime } from "@inngest/realtime";
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
  fetchImportArchivedVacanciesToken,
  fetchImportNewVacanciesToken,
  fetchImportVacancyByUrlToken,
  triggerImportArchivedVacancies,
  triggerImportNewVacancies,
  triggerImportVacancyByUrl,
} from "~/actions/vacancy-import";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";
import { ImportProgress } from "./import-progress";

export function VacancyImportSection() {
  const { workspace } = useWorkspace();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const trpc = useTRPC();
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [vacancyUrl, setVacancyUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery(
    trpc.integration.list.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    {
      enabled: !!workspace?.id,
    },
  );

  // Проверяем наличие активной интеграции с HH
  const hhIntegration = integrations?.find(
    (int) => int.type === "hh" && int.isActive,
  );
  const hasActiveHHIntegration = !!hhIntegration;

  // Progress tracking states
  const [newVacanciesToken, setNewVacanciesToken] =
    useState<Realtime.Subscribe.Token | null>(null);
  const [archivedVacanciesToken, setArchivedVacanciesToken] =
    useState<Realtime.Subscribe.Token | null>(null);
  const [byUrlToken, setByUrlToken] = useState<Realtime.Subscribe.Token | null>(
    null,
  );
  const [byUrlRequestId, setByUrlRequestId] = useState<string | null>(null);

  const [isImportingNew, setIsImportingNew] = useState(false);
  const [isImportingArchived, setIsImportingArchived] = useState(false);
  const [isImportingByUrl, setIsImportingByUrl] = useState(false);

  const handleImportNew = async () => {
    if (!workspace?.id) return;

    try {
      setIsImportingNew(true);
      const token = await fetchImportNewVacanciesToken(workspace.id);
      setNewVacanciesToken(token);
      await triggerImportNewVacancies(workspace.id);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setNewVacanciesToken(null);
      setIsImportingNew(false);
    }
  };

  const handleImportArchived = async () => {
    if (!workspace?.id) return;

    try {
      setIsImportingArchived(true);
      const token = await fetchImportArchivedVacanciesToken(workspace.id);
      setArchivedVacanciesToken(token);
      await triggerImportArchivedVacancies(workspace.id);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setArchivedVacanciesToken(null);
      setIsImportingArchived(false);
    }
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

      const requestId = await triggerImportVacancyByUrl(
        workspace.id,
        vacancyUrl,
      );
      setByUrlRequestId(requestId);

      const token = await fetchImportVacancyByUrlToken(workspace.id, requestId);
      setByUrlToken(token);

      setVacancyUrl("");
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingByUrl(false);
    }
  };

  const handleNewVacanciesComplete = () => {
    setIsImportingNew(false);
    setNewVacanciesToken(null);
  };

  const handleArchivedVacanciesComplete = () => {
    setIsImportingArchived(false);
    setArchivedVacanciesToken(null);
  };

  const handleByUrlComplete = () => {
    setIsImportingByUrl(false);
    setByUrlToken(null);
    setByUrlRequestId(null);
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
              onClick={handleImportNew}
              disabled={isImportingNew || !workspace?.id}
            >
              <Download className="h-4 w-4 mr-2" />
              Загрузить активные вакансии
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImportArchived}
              disabled={isImportingArchived || !workspace?.id}
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

          {/* Progress indicators */}
          {isImportingNew && newVacanciesToken && workspace?.id && (
            <ImportProgress
              type="new"
              workspaceId={workspace.id}
              token={newVacanciesToken}
              onComplete={handleNewVacanciesComplete}
            />
          )}

          {isImportingArchived && archivedVacanciesToken && workspace?.id && (
            <ImportProgress
              type="archived"
              workspaceId={workspace.id}
              token={archivedVacanciesToken}
              onComplete={handleArchivedVacanciesComplete}
            />
          )}

          {isImportingByUrl &&
            byUrlToken &&
            byUrlRequestId &&
            workspace?.id && (
              <ImportProgress
                type="by-url"
                workspaceId={workspace.id}
                requestId={byUrlRequestId}
                token={byUrlToken}
                onComplete={handleByUrlComplete}
              />
            )}
        </CardContent>
      </Card>

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
