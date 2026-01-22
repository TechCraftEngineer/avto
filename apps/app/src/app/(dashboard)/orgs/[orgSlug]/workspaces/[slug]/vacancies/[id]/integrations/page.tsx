"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconBolt, IconFilter, IconMessage } from "@tabler/icons-react";
import { use } from "react";
import { PageHeader } from "~/components/layout";
import { VacancyIntegrationManager } from "~/components/vacancy";
import { useWorkspaceContext } from "~/contexts/workspace-context";

interface VacancyIntegrationsPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function VacancyIntegrationsPage({
  params,
}: VacancyIntegrationsPageProps) {
  const { id } = use(params);
  const { workspaceId } = useWorkspaceContext();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Интеграции"
        description="Управление интеграциями вакансии с внешними платформами и настройка каналов коммуникации"
      />

      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Публикации на платформах */}
          <VacancyIntegrationManager
            vacancyId={id}
            workspaceId={workspaceId ?? ""}
          />

          {/* Будущие разделы настроек */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconMessage className="size-5 text-muted-foreground" />
                Каналы коммуникации
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Настройте каналы общения с кандидатами для каждой платформы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground/50">
                <IconMessage className="size-8 mx-auto mb-2" />
                <p className="text-sm">
                  Настройки каналов коммуникации скоро появятся
                </p>
                <p className="text-xs mt-1">
                  Здесь можно будет настроить, как общаться с кандидатами из
                  разных источников
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconBolt className="size-5 text-muted-foreground" />
                Автоматические ответы
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Настройте автоматические ответы кандидатам на разных этапах
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground/50">
                <IconBolt className="size-8 mx-auto mb-2" />
                <p className="text-sm">Автоматические ответы скоро появятся</p>
                <p className="text-xs mt-1">
                  Шаблоны ответов и автоответы кандидатам
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconFilter className="size-5 text-muted-foreground" />
                Фильтры кандидатов
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Настройте фильтры для автоматического отбора кандидатов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground/50">
                <IconFilter className="size-8 mx-auto mb-2" />
                <p className="text-sm">Фильтры кандидатов скоро появятся</p>
                <p className="text-xs mt-1">
                  Автоматический отбор по критериям
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
