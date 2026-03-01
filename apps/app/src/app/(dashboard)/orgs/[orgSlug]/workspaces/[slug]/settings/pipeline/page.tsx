import type { Metadata } from "next";
import { PipelineStagesSettings } from "~/components/settings/components/pipeline-stages-settings/pipeline-stages-settings";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: workspaceSlug } = await params;
  return {
    title: `Этапы канбана — ${workspaceSlug}`,
    description: "Настройте этапы для канбан-досок вакансий и заданий.",
  };
}

export default async function PipelineSettingsPage() {
  return (
    <>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Этапы канбана</h2>
        <p className="text-sm text-muted-foreground">
          Настройте этапы для канбан-досок вакансий и заданий. Название и
          порядок этапов можно изменить.
        </p>
      </div>

      <PipelineStagesSettings />
    </>
  );
}
