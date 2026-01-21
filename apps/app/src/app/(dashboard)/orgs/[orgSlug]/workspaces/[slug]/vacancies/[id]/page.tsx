"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconEye,
  IconFileDescription,
  IconMapPin,
  IconMessage,
  IconRobot,
  IconTrendingUp,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { VacancyRequirements, VacancyIntegrationManager } from "~/components/vacancy";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { AddPublicationDialog } from "./_components/add-publication-dialog";

type VacancyDetail = RouterOutputs["freelancePlatforms"]["getVacancyById"];
type VacancyPublication = NonNullable<
  VacancyDetail["vacancy"]["publications"]
>[number];

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  HH: {
    label: "HeadHunter",
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
  HH_API: {
    label: "HeadHunter (API)",
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
  KWORK: {
    label: "Kwork",
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  FL_RU: {
    label: "FL.ru",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  FREELANCE_RU: {
    label: "Freelance.ru",
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  AVITO: {
    label: "Avito",
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  SUPERJOB: {
    label: "SuperJob",
    color: "bg-sky-500/10 text-sky-600 border-sky-200",
  },
  HABR: {
    label: "Хабр Карьера",
    color: "bg-zinc-500/10 text-zinc-600 border-zinc-200",
  },
  MANUAL: {
    label: "Вручную",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  WEB_LINK: {
    label: "Прямая ссылка",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  },
  TELEGRAM: {
    label: "Telegram",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  },
};

export default function VacancyDetailPage() {
  const {
    id,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useTRPC();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data, isLoading } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      vacancyId: id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const shortlist = shortlistData?.candidates ?? [];

  const handleCopyLink = async () => {
    if (!data?.interviewLink?.url) return;

    try {
      await navigator.clipboard.writeText(data.interviewLink.url);
      setCopiedLink(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleCopyTemplate = async () => {
    if (!data?.vacancy || !data?.interviewLink?.url) return;

    const template = `${data.vacancy.description || data.vacancy.title}

Для отклика пройдите короткое AI-интервью (10–15 минут):
${data.interviewLink.url}

После прохождения интервью мы свяжемся с вами при положительном решении.`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 rounded-full border-b-2 border-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <IconMessage className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">Вакансия не найдена</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Возможно, вакансия была удалена или у вас нет к ней доступа.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}>
            К списку вакансий
          </Link>
        </Button>
      </div>
    );
  }

  const { vacancy, responseStats, interviewLink } = data;
  const isFreelancePlatform = [
    "KWORK",
    "FL_RU",
    "FREELANCE_RU",
    "AVITO",
    "SUPERJOB",
  ].includes(vacancy.source.toUpperCase());
  const source = SOURCE_CONFIG[vacancy.source.toUpperCase()] || {
    label: vacancy.source,
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  const totalResponses = Object.values(responseStats).reduce(
    (acc, val) => acc + val,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* ЛЕВАЯ КОЛОНКА */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-medium gap-1.5">
              <div
                className={`size-1.5 rounded-full ${source?.color?.split(" ")[0]?.replace("/10", "") ?? "bg-gray-500"}`}
              />
              {source.label}
            </Badge>
            {vacancy.publications?.map((pub: VacancyPublication) => {
              const pubConfig = SOURCE_CONFIG[pub.platform.toUpperCase()] || {
                label: pub.platform,
                color: "bg-gray-500",
              };
              return (
                <Badge
                  key={pub.id}
                  variant="secondary"
                  className="font-medium gap-1.5"
                >
                  <div
                    className={`size-1.5 rounded-full ${pubConfig?.color?.split(" ")[0]?.replace("/10", "") ?? "bg-gray-500"}`}
                  />
                  {pubConfig.label}
                </Badge>
              );
            })}
            <Badge variant={vacancy.isActive ? "default" : "secondary"}>
              {vacancy.isActive ? "Активна" : "Неактивна"}
            </Badge>
            <AddPublicationDialog
              vacancyId={id}
              workspaceId={workspace?.id ?? ""}
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {vacancy.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {vacancy.region && (
                <div className="flex items-center gap-1.5">
                  <IconMapPin className="size-4" />
                  <span>{vacancy.region}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <IconCalendar className="size-4" />
                <span>
                  {new Date(vacancy.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconEye className="size-4" />
                <span>{vacancy.views ?? 0} просмотров</span>
              </div>
            </div>
          </div>

          {vacancy.url && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="size-3.5" />
                  Перейти к оригиналу
                </a>
              </Button>
            </div>
          )}
        </div>

        <Card className="border-l-4 border-l-primary/50 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/50 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconFileDescription className="size-5 text-primary" />
              Описание вакансии
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {vacancy.description ? (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {vacancy.description}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 gap-2">
                <IconFileDescription className="size-8" />
                <span className="text-sm">Описание отсутствует</span>
              </div>
            )}
          </CardContent>
        </Card>

        {vacancy.requirements && (
          <VacancyRequirements requirements={vacancy.requirements} />
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <div className="space-y-6">
        {isFreelancePlatform && (
          <Button asChild className="w-full h-10 gap-2">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/import`}
            >
              <IconUpload className="size-4" />
              Импорт откликов
            </Link>
          </Button>
        )}

        {interviewLink && (
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <IconRobot className="size-4 text-primary" />
                <CardTitle className="text-sm">AI-интервью</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Ссылка для кандидатов из внешних источников
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border bg-background px-3 py-1.5 font-mono text-[11px] truncate flex items-center shadow-sm">
                  {interviewLink.url}
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  {copiedLink ? (
                    <IconCheck className="size-3.5 text-green-600" />
                  ) : (
                    <IconCopy className="size-3.5" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleCopyTemplate}
                variant="ghost"
                size="sm"
                className="w-full h-8 justify-between text-xs px-2"
              >
                <span className="flex items-center gap-2">
                  <IconMessage className="size-3.5" />
                  Копировать шаблон
                </span>
                {copiedTemplate ? (
                  <IconCheck className="size-3.5" />
                ) : (
                  <IconArrowRight className="size-3.5" />
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IconTrendingUp className="size-4 text-muted-foreground" />
                Статистика
              </CardTitle>
              <Badge variant="outline" className="font-semibold tabular-nums">
                {totalResponses}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(responseStats).map(([sourceKey, count]) => {
              const config = SOURCE_CONFIG[sourceKey.toUpperCase()] || {
                label: sourceKey,
              };
              return (
                <div
                  key={sourceKey}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{config.label}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
              );
            })}
            {Object.keys(responseStats).length === 0 && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                Нет откликов
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IconUsers className="size-4 text-muted-foreground" />
              Шортлист
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {shortlistLoading ? (
              <div className="p-4 flex justify-center">
                <div className="size-4 border-b-2 border-primary animate-spin rounded-full" />
              </div>
            ) : shortlist.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Шортлист пуст
              </div>
            ) : (
              <div className="divide-y border-t">
                {shortlist.slice(0, 5).map((candidate, index) => (
                  <Link
                    key={candidate.responseId}
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-7 rounded-full bg-muted flex items-center justify-center font-semibold text-[10px]">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-primary">
                          {candidate.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Оценка: {candidate.overallScore}
                        </p>
                      </div>
                    </div>
                    <IconArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
            {shortlist.length > 5 && (
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full text-xs h-8" asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/shortlist`}
                  >
                    Показать всех ({shortlist.length})
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <VacancyIntegrationManager
          vacancyId={id}
          workspaceId={workspace?.id ?? ""}
        />
      </div>
    </div>
  );
}
