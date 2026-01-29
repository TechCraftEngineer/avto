import { paths } from "@qbs-autonaim/config";
import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconMessageCircle,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import { redirect } from "next/navigation";
import type React from "react";
import { getSession } from "~/auth/server";
import { PageHeader } from "~/components/layout";

const organizationRepository = new OrganizationRepository(db);

export default async function OrganizationUsagePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const { orgSlug } = await params;

  const organization = await organizationRepository.findBySlug(orgSlug);
  if (!organization) {
    redirect(paths.dashboard.root);
  }

  const access = await organizationRepository.checkAccess(
    organization.id,
    session.user.id,
  );

  if (!access) {
    redirect(paths.accessDenied);
  }

  // TODO: Получить реальные данные из БД
  const stats = await getOrganizationStats(organization.id);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Использование"
        description="Статистика использования ресурсов организации за текущий месяц"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Пространства"
          value={stats.workspaces.current}
          limit={stats.workspaces.limit}
          icon={IconBriefcase}
          description="активных пространств"
        />
        <MetricCard
          title="Участники"
          value={stats.members.current}
          limit={stats.members.limit}
          icon={IconUsers}
          description="участников команды"
        />
        <MetricCard
          title="Диалоги"
          value={stats.conversations.current}
          limit={stats.conversations.limit}
          icon={IconMessageCircle}
          description="активных диалогов"
        />
        <MetricCard
          title="AI запросы"
          value={stats.aiRequests.current}
          limit={stats.aiRequests.limit}
          icon={IconSparkles}
          description="запросов в месяц"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="workspaces">Пространства</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Использование ресурсов</CardTitle>
              <CardDescription>
                Детальная информация по каждому типу ресурсов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResourceItem
                label="Пространства"
                current={stats.workspaces.current}
                limit={stats.workspaces.limit}
                description="Количество созданных пространств"
              />
              <ResourceItem
                label="Участники команды"
                current={stats.members.current}
                limit={stats.members.limit}
                description="Пользователи с доступом к организации"
              />
              <ResourceItem
                label="Активные диалоги"
                current={stats.conversations.current}
                limit={stats.conversations.limit}
                description="Диалоги со статусом ACTIVE"
              />
              <ResourceItem
                label="AI запросы"
                current={stats.aiRequests.current}
                limit={stats.aiRequests.limit}
                description="Запросы к AI моделям за месяц"
              />
              <ResourceItem
                label="Интеграции"
                current={stats.integrations.current}
                limit={stats.integrations.limit}
                description="Подключенные интеграции"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Пространства</CardTitle>
              <CardDescription>
                Список всех пространств организации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.workspacesList.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {ws.logo ? (
                        <div
                          className="size-8 rounded bg-cover bg-center"
                          style={{ backgroundImage: `url(${ws.logo})` }}
                          role="img"
                          aria-label={ws.name}
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded bg-muted">
                          <IconBriefcase className="size-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{ws.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {ws.vacanciesCount} вакансий • {ws.conversationsCount}{" "}
                          диалогов
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{ws.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Активность за последние 7 дней</CardTitle>
              <CardDescription>
                Динамика использования основных функций
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.dailyActivity.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{day.date}</p>
                      <p className="text-muted-foreground text-xs">
                        {day.conversations} новых диалогов
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm font-medium tabular-nums">
                          {day.aiRequests}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          AI запросов
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium tabular-nums">
                          {day.responses}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          откликов
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {stats.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
            <CardDescription>
              Важная информация об использовании ресурсов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.warnings.map((warning) => (
              <div
                key={warning.title}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  warning.type === "warning"
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                    : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                }`}
              >
                <warning.icon
                  className={`mt-0.5 size-4 ${
                    warning.type === "warning"
                      ? "text-yellow-600 dark:text-yellow-500"
                      : "text-blue-600 dark:text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{warning.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {warning.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  limit,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  const percentage = (value / limit) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="text-muted-foreground text-xs">из {limit}</p>
        <Progress value={percentage} className="mt-3" />
        <p className="text-muted-foreground mt-2 text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

function ResourceItem({
  label,
  current,
  limit,
  description,
}: {
  label: string;
  current: number;
  limit: number;
  description: string;
}) {
  const percentage = (current / limit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums">
            {current} / {limit}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {percentage.toFixed(1)}%
          </p>
        </div>
      </div>
      <Progress value={percentage} />
    </div>
  );
}

type WarningType = "info" | "warning";

interface Warning {
  type: WarningType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// TODO: Реализовать получение реальных данных из БД
async function getOrganizationStats(_organizationId: string) {
  // Временные моковые данные
  const warnings: Warning[] = [
    {
      type: "info",
      icon: IconBriefcase,
      title: "Использование в норме",
      description:
        "Все ресурсы используются эффективно. У вас достаточно места для роста.",
    },
  ];

  return {
    workspaces: { current: 3, limit: 10 },
    members: { current: 5, limit: 25 },
    conversations: { current: 42, limit: 1000 },
    aiRequests: { current: 1234, limit: 10000 },
    integrations: { current: 2, limit: 5 },
    workspacesList: [
      {
        id: "1",
        name: "Основной воркспейс",
        logo: null,
        vacanciesCount: 8,
        conversationsCount: 25,
        status: "Активен",
      },
      {
        id: "2",
        name: "Тестовый воркспейс",
        logo: null,
        vacanciesCount: 3,
        conversationsCount: 12,
        status: "Активен",
      },
      {
        id: "3",
        name: "Архивный воркспейс",
        logo: null,
        vacanciesCount: 0,
        conversationsCount: 5,
        status: "Архив",
      },
    ],
    dailyActivity: [
      { date: "18 дек", conversations: 5, aiRequests: 45, responses: 12 },
      { date: "19 дек", conversations: 7, aiRequests: 52, responses: 15 },
      { date: "20 дек", conversations: 6, aiRequests: 48, responses: 14 },
      { date: "21 дек", conversations: 8, aiRequests: 61, responses: 18 },
      { date: "22 дек", conversations: 4, aiRequests: 38, responses: 9 },
      { date: "23 дек", conversations: 9, aiRequests: 67, responses: 21 },
      { date: "24 дек", conversations: 3, aiRequests: 29, responses: 8 },
    ],
    warnings,
  };
}
