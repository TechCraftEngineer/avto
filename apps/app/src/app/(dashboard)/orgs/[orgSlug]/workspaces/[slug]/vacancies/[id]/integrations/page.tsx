"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconBolt, IconFilter, IconMessage } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { PageHeader } from "~/components/layout";
import { VacancyIntegrationManager } from "~/components/vacancy";
import { CommunicationChannelsIntegration } from "~/components/vacancy/integrations/communication-channels-integration";
import { AutoResponsesIntegration } from "~/components/vacancy/integrations/auto-responses-integration";
import { CandidateFiltersIntegration } from "~/components/vacancy/integrations/candidate-filters-integration";
import { useWorkspaceContext } from "~/contexts/workspace-context";

export default function VacancyIntegrationsPage() {
  const { id } = useParams<{ orgSlug: string; slug: string; id: string }>();
  const { workspaceId } = useWorkspaceContext();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Интеграции"
        description="Управление интеграциями вакансии с внешними платформами и настройка каналов коммуникации"
      />

      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Публикации на платформах */}
          {workspaceId && workspaceId !== "" && (
            <VacancyIntegrationManager
              vacancyId={id}
              workspaceId={workspaceId}
            />
          )}

          {/* Каналы коммуникации */}
          {workspaceId && workspaceId !== "" && (
            <CommunicationChannelsIntegration
              vacancyId={id}
              workspaceId={workspaceId}
            />
          )}

         {/* Автоматические ответы */}
         {workspaceId && workspaceId !== "" && (
           <AutoResponsesIntegration
             vacancyId={id}
             workspaceId={workspaceId}
           />
         )}

         {/* Фильтры кандидатов */}
         {workspaceId && workspaceId !== "" && (
           <CandidateFiltersIntegration
             vacancyId={id}
             workspaceId={workspaceId}
           />
         )}
        </div>
      </div>
    </div>
  );
}
