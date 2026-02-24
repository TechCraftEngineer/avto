"use client";

import { use } from "react";
import {
  ActiveVacancies,
  DashboardStats,
  PendingActions,
  QuickActions,
  RecentResponses,
} from "~/components/dashboard/components";
import { GettingStartedContainer } from "~/components/getting-started";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug: workspaceSlug } = use(params);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        {/* Компактная статистика */}
        <DashboardStats />

        {/* Быстрые действия */}
        <QuickActions orgSlug={orgSlug} workspaceSlug={workspaceSlug} />

        {/* Основной контент */}
        <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Оценить — отклики без скрининга */}
          <PendingActions orgSlug={orgSlug} workspaceSlug={workspaceSlug} />

          {/* На рассмотрении — оценённые, ждут решения */}
          <RecentResponses orgSlug={orgSlug} workspaceSlug={workspaceSlug} />

          {/* Вакансии в работе — с новыми в приоритете */}
          <ActiveVacancies orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
        </div>
      </div>
      <div className="hidden md:block">
        <GettingStartedContainer />
      </div>
    </>
  );
}
