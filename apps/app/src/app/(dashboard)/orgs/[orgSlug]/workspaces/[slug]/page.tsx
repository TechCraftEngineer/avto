"use client";

import { use } from "react";
import {
  ActiveVacancies,
  AIAssistantPanel,
  DashboardStats,
  RecentResponses,
  ResponsesChart,
  TopResponses,
} from "~/components/dashboard";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug: workspaceSlug } = use(params);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col gap-4">
          {/* Статистика - на весь экран */}
          <DashboardStats />

          {/* AI-Ассистент - на весь экран */}
          <AIAssistantPanel orgSlug={orgSlug} workspaceSlug={workspaceSlug} />

          {/* Основной контент - на весь экран */}
          <div className="grid flex-1 gap-4 md:grid-cols-2 @7xl/main:grid-cols-3">
            <RecentResponses orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
            <ActiveVacancies orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
            <TopResponses
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              className="md:col-span-2 @7xl/main:col-span-1"
            />
          </div>

          {/* График - на весь экран */}
          <ResponsesChart />
        </div>
      </div>
    </div>
  );
}
