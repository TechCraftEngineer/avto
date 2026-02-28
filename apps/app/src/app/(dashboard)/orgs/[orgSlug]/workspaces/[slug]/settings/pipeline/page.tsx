import { PipelineStagesSettings } from "~/components/settings/components/pipeline-stages-settings/pipeline-stages-settings";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default async function PipelineSettingsPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug } = await params;

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Этапы канбана</h2>
        <p className="text-sm text-muted-foreground">
          Настройте этапы для канбан-досок вакансий и заданий. Название и
          порядок этапов можно изменить.
        </p>
      </div>

      <PipelineStagesSettings orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
    </>
  );
}
