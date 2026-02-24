"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { PageHeader } from "~/components/layout";
import { VacancyImportSection } from "~/components/vacancies/components";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

export default function ImportVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Импорт вакансий"
        description="Используйте расширение «Помощник рекрутера» для импорта вакансий с HeadHunter"
      >
        {orgSlug && workspaceSlug ? (
          <Button asChild variant="outline" className="h-9 gap-2">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
            >
              <IconArrowLeft className="size-4" />
              <span>Назад</span>
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline" className="h-9 gap-2">
            <IconArrowLeft className="size-4" />
            <span>Назад</span>
          </Button>
        )}
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <VacancyImportSection />
      </div>
    </div>
  );
}
