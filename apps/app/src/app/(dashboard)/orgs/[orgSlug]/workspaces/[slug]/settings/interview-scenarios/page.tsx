import { InterviewScenariosManagement } from "~/components";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default async function InterviewScenariosPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug } = await params;

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Сценарии интервью
        </h2>
        <p className="text-sm text-muted-foreground">
          Создавайте и управляйте сценариями проведения интервью для ваших
          заданий
        </p>
      </div>

      <InterviewScenariosManagement
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}
