"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import {
  IconAlertCircle,
  IconBriefcase,
  IconChecks,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

type PlatformFilter = "all" | "KWORK" | "FL_RU" | "FREELANCE_RU";

export default function FreelanceDashboardPage() {
  const { orgSlug, slug: workspaceSlug } = useParams<{
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useORPC();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const { data, isLoading } = useQuery({
    ...api.freelancePlatforms.getDashboardStats.queryOptions({
      workspaceId: workspace?.id ?? "",
      status: statusFilter,
      platformSource: platformFilter === "all" ? undefined : platformFilter,
    }),
    enabled: !!workspace?.id,
  });

  const getPlatformName = (source: string) => {
    const platforms: Record<string, string> = {
      KWORK: "Kwork",
      FL_RU: "FL.ru",
      FREELANCE_RU: "Freelance.ru",
    };
    return platforms[source] || source;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const overview = data?.overview ?? {
    totalJobs: 0,
    totalResponses: 0,
    totalNewResponses: 0,
    totalSuitableResumes: 0,
    avgCompletionRate: 0,
  };
  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <PageHeader
        title="Дашборд фриланс-платформ"
        description="Обзор активности и статистика по заданиям на фриланс-платформах"
      />

      {/* Обзорные метрики */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заданий</CardTitle>
            <IconBriefcase
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {overview.totalJobs}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего откликов
            </CardTitle>
            <IconUsers
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {overview.totalResponses}
            </div>
            {overview.totalNewResponses > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                +{overview.totalNewResponses} новых
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Подходящих резюме
            </CardTitle>
            <IconChecks
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {overview.totalSuitableResumes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Коэффициент завершения
            </CardTitle>
            <IconAlertCircle
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {overview.avgCompletionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Завершённых интервью
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>
            Фильтруйте задания по статусу и платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="status-filter"
                className="text-sm font-medium mb-2 block"
              >
                Статус
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | "active" | "inactive")
                }
              >
                <SelectTrigger
                  id="status-filter"
                  className="min-h-[44px] md:min-h-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="platform-filter"
                className="text-sm font-medium mb-2 block"
              >
                Платформа
              </label>
              <Select
                value={platformFilter}
                onValueChange={(value) =>
                  setPlatformFilter(value as PlatformFilter)
                }
              >
                <SelectTrigger
                  id="platform-filter"
                  className="min-h-[44px] md:min-h-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все платформы</SelectItem>
                  <SelectItem value="KWORK">Kwork</SelectItem>
                  <SelectItem value="FL_RU">FL.ru</SelectItem>
                  <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список заданий */}
      <Card>
        <CardHeader>
          <CardTitle>Задания</CardTitle>
          <CardDescription>
            Список заданий с ключевой статистикой
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Заданий не найдено
              </p>
              <p className="text-xs text-muted-foreground">
                Создайте задание для фриланс-платформы
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{job.title}</h3>
                      <Badge variant="outline">
                        {getPlatformName(job.source)}
                      </Badge>
                      {job.isActive ? (
                        <Badge variant="default">Активна</Badge>
                      ) : (
                        <Badge variant="secondary">Неактивна</Badge>
                      )}
                      {job.needsAttention && (
                        <Badge variant="destructive">
                          <IconAlertCircle
                            className="size-3 mr-1"
                            aria-hidden="true"
                          />
                          Требует внимания
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                      <div>
                        <span className="font-medium">Откликов:</span>{" "}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {job.totalResponses ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Новых:</span>{" "}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {job.newResponses ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Интервью:</span>{" "}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {job.completedInterviews ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Оценка:</span>{" "}
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {Math.round(job.avgScore ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Создано:{" "}
                      {new Date(job.createdAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0 min-h-[44px] md:min-h-0"
                  >
                    <Link
                      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${job.id}`}
                      aria-label={`Посмотреть задание ${job.title}`}
                    >
                      Подробнее
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
