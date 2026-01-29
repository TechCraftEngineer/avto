"use client";

import { Alert, AlertDescription, Separator, Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { IntegrationCard } from "~/components/settings/integration-card";
import { IntegrationCategorySection } from "~/components/settings/integration-category-section";
import { IntegrationDialog } from "~/components/settings/integration-dialog";
import { TelegramSessionsCard } from "~/components/settings/telegram-sessions-card";
import { useWorkspace } from "~/hooks/use-workspace";
import {
  AVAILABLE_INTEGRATIONS,
  INTEGRATION_CATEGORIES,
} from "~/lib/integrations";
import { useTRPC } from "~/trpc/react";

export default function IntegrationsPage() {
  const api = useTRPC();
  const { workspace, isLoading: workspaceLoading } = useWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const workspaceId = workspace?.id || "";
  const userRole = workspace?.role;

  const { data: integrations, isLoading } = useQuery({
    ...api.integration.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const { data: telegramSessions } = useQuery({
    ...api.telegram.getSessions.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const handleCreate = (type: string) => {
    setSelectedType(type);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (type: string) => {
    setSelectedType(type);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setIsEditing(false);
  };

  if (isLoading || workspaceLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const hasTelegramSession = telegramSessions && telegramSessions.length > 0;
  const integrationsByCategory = AVAILABLE_INTEGRATIONS.reduce(
    (acc, integration) => {
      const category = integration.category;
      if (!acc[category]) {
        acc[category] = [] as Array<typeof integration>;
      }
      acc[category]?.push(integration);
      return acc;
    },
    {} as Record<string, Array<(typeof AVAILABLE_INTEGRATIONS)[number]>>,
  );

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Интеграции</h2>
        <p className="text-sm text-muted-foreground">
          Управляйте интеграциями для проведения интервью и поиска кандидатов
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Как это работает:</strong> Подключите Telegram для проведения
          интервью с кандидатами, затем настройте интеграции с платформами
          поиска работы. Система будет автоматически искать подходящих
          кандидатов и организовывать интервью через Telegram.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {/* Секция коммуникации (Telegram) */}
        <IntegrationCategorySection
          categoryId={INTEGRATION_CATEGORIES.COMMUNICATION.id}
          name={INTEGRATION_CATEGORIES.COMMUNICATION.name}
          description={INTEGRATION_CATEGORIES.COMMUNICATION.description}
          icon={INTEGRATION_CATEGORIES.COMMUNICATION.icon}
        >
          {workspaceId && <TelegramSessionsCard workspaceId={workspaceId} />}
        </IntegrationCategorySection>

        <Separator />

        {/* Секция поиска работы */}
        <IntegrationCategorySection
          categoryId={INTEGRATION_CATEGORIES.JOB_SEARCH.id}
          name={INTEGRATION_CATEGORIES.JOB_SEARCH.name}
          description={INTEGRATION_CATEGORIES.JOB_SEARCH.description}
          icon={INTEGRATION_CATEGORIES.JOB_SEARCH.icon}
          showTelegramInfo={!hasTelegramSession}
        >
          {integrationsByCategory["job-search"]?.map((availableIntegration) => {
            const existingIntegration = integrations?.find(
              (i) => i.type === availableIntegration.type,
            );

            return (
              <IntegrationCard
                key={availableIntegration.type}
                availableIntegration={availableIntegration}
                integration={existingIntegration}
                onCreate={() => handleCreate(availableIntegration.type)}
                onEdit={() => handleEdit(availableIntegration.type)}
                workspaceId={workspaceId}
                userRole={userRole}
                showDetailedDescription
              />
            );
          })}
        </IntegrationCategorySection>
      </div>

      <IntegrationDialog
        open={dialogOpen}
        onClose={handleClose}
        selectedType={selectedType}
        isEditing={isEditing}
      />
    </>
  );
}
