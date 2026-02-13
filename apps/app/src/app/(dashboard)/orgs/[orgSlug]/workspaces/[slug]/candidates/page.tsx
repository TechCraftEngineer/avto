import { CandidatesTableView } from "~/components/candidates/components";
import { PageHeader } from "~/components/layout/components";

export default function CandidatesPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 overflow-auto">
        <PageHeader
          title="База кандидатов"
          description="Полная база данных всех кандидатов"
          tooltipContent={`База кандидатов содержит всех соискателей, откликнувшихся на ваши вакансии. Здесь можно искать, фильтровать и просматривать профили кандидатов.\n\n[Подробнее в документации](${process.env.NEXT_PUBLIC_DOCS_URL}/candidates)`}
        />
        <CandidatesTableView />
      </div>
    </div>
  );
}
