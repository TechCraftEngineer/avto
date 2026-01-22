"use client";

import { Card } from "@qbs-autonaim/ui";
import { useParams } from "next/navigation";
import { RecruiterAgentChat } from "~/components/recruiter-agent/chat";
import { ResponseTable } from "~/components/vacancy";

export default function VacancyResponsesPage() {
  const { slug: workspaceSlug, id } = useParams<{
    slug: string;
    id: string;
  }>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Отклики
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление и интеллектуальный анализ кандидатов для вашей вакансии
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Обновления в реальном времени
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="p-1 sm:p-6 relative">
              <ResponseTable vacancyId={id} workspaceSlug={workspaceSlug} />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden h-full">
            <div className="h-[600px]">
              <RecruiterAgentChat
                vacancyId={id}
                title="AI-ассистент"
                subtitle="Помогает с приоритетами, вопросами и рисками"
                placeholder="Кого посмотреть первым? Какие вопросы задать?"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
