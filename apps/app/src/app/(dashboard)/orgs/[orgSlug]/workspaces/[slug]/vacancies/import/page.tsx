"use client";

import Button from "@qbs-autonaim/ui/button";
import Card from "@qbs-autonaim/ui/card";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { PageHeader } from "~/components/layout";
import { ImportSection } from "~/components/vacancies";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

export default function ImportVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Импорт вакансий"
        description="Загрузите вакансии с HeadHunter для автоматического отслеживания откликов"
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
        <ImportSection />

        <Card className="border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            Как это работает?
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>
                Выберите режим импорта: активные вакансии, архивные или по
                ссылке
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>
                Система автоматически загрузит данные вакансий с HeadHunter
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>Следите за прогрессом импорта в реальном времени</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>
                После завершения импорта вакансии появятся в списке с
                автоматическим отслеживанием откликов
              </span>
            </li>
          </ol>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
            Важная информация
          </h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600 dark:text-amber-400">
                •
              </span>
              <span>
                Массовый импорт может занять несколько минут в зависимости от
                количества вакансий
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600 dark:text-amber-400">
                •
              </span>
              <span>
                Существующие вакансии будут обновлены, дубликаты не создаются
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600 dark:text-amber-400">
                •
              </span>
              <span>
                Для импорта по ссылке поддерживаются только вакансии с hh.ru
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

