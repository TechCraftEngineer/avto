"use client";

import { PageHeader } from "~/components/layout";
import { VacancyCreatorContainer } from "~/components/vacancies/components/vacancy-creator/vacancy-creator-container";
import { useWorkspace } from "~/hooks/use-workspace";
import { env } from "~/env";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

export default function VacancyGeneratePage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
        <PageHeader
          title="Генерация вакансии"
          description="Автоматическая генерация контента с помощью AI"
          tooltipContent={`AI поможет сгенерировать описание вакансии на основе ваших требований. Вы можете отредактировать результат перед публикацией.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/ai-assistant)`}
        />
        <div className="flex-1 overflow-hidden px-4 pb-4 md:px-6 lg:px-8">
          <VacancyCreatorContainer
            workspaceId={workspace?.id ?? ""}
            orgSlug={orgSlug ?? ""}
            workspaceSlug={workspaceSlug ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
