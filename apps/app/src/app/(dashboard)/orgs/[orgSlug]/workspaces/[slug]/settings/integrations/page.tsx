"use client";

import { Alert, AlertDescription } from "@qbs-autonaim/ui/alert";
import { Separator } from "@qbs-autonaim/ui/separator";
import { Skeleton } from "@qbs-autonaim/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  IntegrationCard,
  IntegrationCategorySection,
  IntegrationDialog,
  TelegramSessionsCard,
} from "~/components";
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
          name={INTEGRATION_CATEGORIES.COMMUNICATION.name}
          description={INTEGRATION_CATEGORIES.COMMUNICATION.description}
          icon={INTEGRATION_CATEGORIES.COMMUNICATION.icon}
        >
          {workspaceId && <TelegramSessionsCard workspaceId={workspaceId} />}
        </IntegrationCategorySection>

        <Separator />

        {/* Секция поиска работы */}
        <IntegrationCategorySection
          name={INTEGRATION_CATEGORIES.JOB_SEARCH.name}
          description={INTEGRATION_CATEGORIES.JOB_SEARCH.description}
          icon={INTEGRATION_CATEGORIES.JOB_SEARCH.icon}
        >
          {/* Подключенные интеграции */}
          {integrationsByCategory["job-search"]
            ?.map((availableIntegration) => {
              const connectedIntegration = integrations?.find(
                (i) => i.type === availableIntegration.type,
              );
              return connectedIntegration
                ? {
                    availableIntegration,
                    integration: connectedIntegration,
                  }
                : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .map((item) => (
              <IntegrationCard
                key={item.availableIntegration.type}
                availableIntegration={item.availableIntegration}
                integration={item.integration}
                onCreate={() => handleCreate(item.availableIntegration.type)}
                onEdit={() => handleEdit(item.availableIntegration.type)}
                workspaceId={workspaceId}
                userRole={userRole}
                showDetailedDescription
              />
            ))}

          {/* Доступные для подключения интеграции */}
          {integrationsByCategory["job-search"]
            ?.filter((availableIntegration) => {
              const existingIntegration = integrations?.find(
                (i) => i.type === availableIntegration.type,
              );
              return !existingIntegration;
            })
            .map((availableIntegration) => {
              return (
                <IntegrationCard
                  key={availableIntegration.type}
                  availableIntegration={availableIntegration}
                  integration={undefined}
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
