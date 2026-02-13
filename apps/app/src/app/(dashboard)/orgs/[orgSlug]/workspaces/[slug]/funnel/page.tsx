import { FunnelAnalytics } from "~/components/funnel/components";
import { PageHeader } from "~/components/layout";

export default function FunnelPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Воронка найма"
          description="Аналитика процесса подбора персонала"
          tooltipContent={`Воронка показывает прогресс кандидатов на каждом этапе подбора. Анализируйте конверсии между этапами и находите узкие места в процессе.\n\n[Подробнее в документации](${process.env.NEXT_PUBLIC_DOCS_URL}/funnel)`}
        />
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="space-y-4 md:space-y-6">
            <FunnelAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
