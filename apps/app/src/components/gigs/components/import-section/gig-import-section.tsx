"use client";

import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/components/alert"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { GigImportByUrlSchema } from "@qbs-autonaim/validators";
import { AlertCircle, Settings } from "lucide-react";
import NextLink from "next/link";
import { useCallback, useMemo } from "react";
import {
  triggerImportGigByUrl,
  triggerImportNewGigs,
} from "~/actions/gig-import";
import { ImportGigByUrlProgress } from "../import/import-gig-by-url-progress";
import { ImportNewGigsProgress } from "../import/import-new-gigs-progress";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { GigImportActions } from "./gig-import-actions";
import { GigImportDialogs } from "./gig-import-dialogs";
import { useGigImportState } from "./use-gig-import-state";
import { useGigPlatformIntegration } from "./use-gig-platform-integration";

export function GigImportSection() {
  const { workspace } = useWorkspace();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();

  const workspaceId = useMemo(() => workspace?.id ?? "", [workspace?.id]);

  const importState = useGigImportState();
  const { hasActiveIntegrations, isLoadingIntegrations } =
    useGigPlatformIntegration(workspaceId);

  const {
    isUrlDialogOpen,
    setIsUrlDialogOpen,
    isConfirmNewDialogOpen,
    setIsConfirmNewDialogOpen,
    isImportingNew,
    setIsImportingNew,
    isImportingByUrl,
    setIsImportingByUrl,
    gigUrl,
    setGigUrl,
    urlError,
    setUrlError,
    byUrlRequestId,
    setByUrlRequestId,
  } = importState;

  const handleImportNew = async () => {
    if (!workspaceId) return;

    setIsConfirmNewDialogOpen(false);

    try {
      setIsImportingNew(true);
      await triggerImportNewGigs(workspaceId);
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingNew(false);
    }
  };

  const handleImportByUrl = async () => {
    if (!workspaceId) return;

    const validationResult = GigImportByUrlSchema.safeParse({ url: gigUrl });

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Введите корректную ссылку на проект";
      setUrlError(errorMessage);
      return;
    }

    try {
      const requestId = crypto.randomUUID();
      setByUrlRequestId(requestId);
      setIsImportingByUrl(true);
      setIsUrlDialogOpen(false);
      setUrlError("");

      await triggerImportGigByUrl(workspaceId, gigUrl, requestId);

      setGigUrl("");
    } catch (error) {
      console.error("Ошибка запуска импорта:", error);
      setIsImportingByUrl(false);
      setByUrlRequestId(null);
    }
  };

  const handleNewGigsComplete = useCallback(() => {
    setIsImportingNew(false);
  }, [setIsImportingNew]);

  const handleByUrlComplete = useCallback(() => {
    setIsImportingByUrl(false);
    setByUrlRequestId(null);
  }, [setIsImportingByUrl, setByUrlRequestId]);

  if (isLoadingIntegrations || !workspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт проектов</CardTitle>
          <CardDescription>
            Загрузите проекты с подключенных платформ в систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-[240px] animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-[240px] animate-pulse rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveIntegrations) {
    const integrationsUrl =
      orgSlug && workspaceSlug
        ? `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`
        : null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Импорт проектов</CardTitle>
          <CardDescription>
            Загрузите проекты с подключенных платформ для отслеживания откликов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertCircle className="size-4" />
            <AlertTitle>Сначала настройте интеграцию</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Для импорта проектов необходимо подключить интеграцию с
                фриланс-платформой в настройках рабочего пространства. После
                настройки вы сможете загружать активные проекты и добавлять их
                по ссылке.
              </p>
              {integrationsUrl ? (
                <Button asChild variant="default" size="sm">
                  <NextLink href={integrationsUrl}>
                    <Settings className="mr-2 size-4" />
                    Перейти в настройки интеграций
                  </NextLink>
                </Button>
              ) : null}
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
          <CardTitle>Импорт проектов</CardTitle>
          <CardDescription>
            Загрузите проекты с подключенных платформ для отслеживания откликов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GigImportActions
            workspaceId={workspaceId}
            hasActiveIntegrations={hasActiveIntegrations}
            isImportingNew={isImportingNew}
            isImportingByUrl={isImportingByUrl}
            onImportNew={() => setIsConfirmNewDialogOpen(true)}
            onImportByUrl={() => setIsUrlDialogOpen(true)}
          />

          {isImportingNew && workspaceId && (
            <ImportNewGigsProgress
              workspaceId={workspaceId}
              onComplete={handleNewGigsComplete}
            />
          )}

          {isImportingByUrl && byUrlRequestId && workspaceId && (
            <ImportGigByUrlProgress
              workspaceId={workspaceId}
              requestId={byUrlRequestId}
              onComplete={handleByUrlComplete}
            />
          )}
        </CardContent>
      </Card>

      <GigImportDialogs
        isConfirmNewDialogOpen={isConfirmNewDialogOpen}
        onConfirmNewDialogChange={setIsConfirmNewDialogOpen}
        onConfirmNew={handleImportNew}
        isUrlDialogOpen={isUrlDialogOpen}
        onUrlDialogChange={setIsUrlDialogOpen}
        gigUrl={gigUrl}
        onGigUrlChange={setGigUrl}
        urlError={urlError}
        onUrlErrorChange={setUrlError}
        onConfirmUrl={handleImportByUrl}
      />
    </>
  );
}
