"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "~/components/layout";
import { VacancyIntegrationManager } from "~/components/vacancy/components";
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
        </div>
      </div>
    </div>
  );
}
