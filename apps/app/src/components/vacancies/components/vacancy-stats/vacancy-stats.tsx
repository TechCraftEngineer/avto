"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  IconBriefcase,
  IconChartBar,
  IconClock,
  IconMessageCircle,
  IconTrendingDown,
  IconTrendingUp,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";

const RESPONSE_QUALITY_CLASSES: Record<
  string,
  { text: string; bg: string; badge: string }
> = {
  green: {
    text: "text-green-600",
    bg: "bg-green-500/10",
    badge: "text-green-700",
  },
  blue: { text: "text-blue-600", bg: "bg-blue-500/10", badge: "text-blue-700" },
  orange: {
    text: "text-orange-600",
    bg: "bg-orange-500/10",
    badge: "text-orange-700",
  },
  red: { text: "text-red-600", bg: "bg-red-500/10", badge: "text-red-700" },
};

const TIME_QUALITY_CLASSES: Record<
  string,
  { text: string; bg: string; badge: string }
> = {
  green: {
    text: "text-green-600",
    bg: "bg-green-500/10",
    badge: "text-green-700",
  },
  blue: { text: "text-blue-600", bg: "bg-blue-500/10", badge: "text-blue-700" },
  orange: {
    text: "text-orange-600",
    bg: "bg-orange-500/10",
    badge: "text-orange-700",
  },
  red: { text: "text-red-600", bg: "bg-red-500/10", badge: "text-red-700" },
};

interface VacancyStatsProps {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
  closedVacancies?: number;
  avgTimeToClose?: number; // в днях
  conversionRate?: number; // процент откликов, перешедших в найм
  isLoading?: boolean;
}

export function VacancyStats({
  totalVacancies,
  activeVacancies,
  totalResponses,
  newResponses,
  closedVacancies = 0,
  avgTimeToClose,
  conversionRate,
  isLoading,
}: VacancyStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 min-[200px]:grid-cols-2 gap-2 sm:gap-3 @xl/main:grid-cols-3 @3xl/main:grid-cols-4 @5xl/main:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => `skeleton-${index}`).map(
          (key) => (
            <Card key={key} className="animate-pulse border-none bg-muted/20">
              <CardHeader className="h-22 @md/main:h-25" />
            </Card>
          ),
        )}
      </div>
    );
  }

  const activePercentage =
    totalVacancies > 0
      ? Math.round((activeVacancies / totalVacancies) * 100)
      : 0;

  const avgResponsesPerVacancy =
    activeVacancies > 0 ? Math.round(totalResponses / activeVacancies) : 0;

  const closedPercentage =
    totalVacancies > 0
      ? Math.round((closedVacancies / totalVacancies) * 100)
      : 0;

  // Определяем качество метрик для подсказок рекрутеру
  const getResponseQuality = (avg: number) => {
    if (avg >= 10) return { label: "Отлично", color: "green" };
    if (avg >= 5) return { label: "Хорошо", color: "blue" };
    if (avg >= 2) return { label: "Средне", color: "orange" };
    return { label: "Низкая", color: "red" };
  };

  const getTimeQuality = (days?: number) => {
    if (!days) return null;
    if (days <= 14) return { label: "Быстро", color: "green" };
    if (days <= 30) return { label: "Норма", color: "blue" };
    if (days <= 60) return { label: "Долго", color: "orange" };
    return { label: "Очень долго", color: "red" };
  };

  const responseQuality = getResponseQuality(avgResponsesPerVacancy);
  const timeQuality = getTimeQuality(avgTimeToClose);

  const stats = [
    {
      title: "Открытые вакансии",
      value: activeVacancies,
      description: `${activePercentage}% от всех (${totalVacancies})`,
      icon: IconBriefcase,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      tooltip: "Вакансии, по которым идёт активный поиск кандидатов",
      action: (
        <Badge
          variant="outline"
          className={cn(
            "border-none px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0",
            activePercentage >= 50
              ? "bg-blue-500/10 text-blue-700"
              : "bg-orange-500/10 text-orange-700",
          )}
        >
          {activePercentage >= 50 ? (
            <IconTrendingUp className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
          ) : (
            <IconTrendingDown className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
          )}
          {activePercentage}%
        </Badge>
      ),
    },
    {
      title: "Новые отклики",
      value: newResponses,
      description: `Всего откликов: ${totalResponses}`,
      icon: IconMessageCircle,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      tooltip: "Отклики, которые требуют вашего внимания",
      action: newResponses > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-purple-500/10 text-purple-700 px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0"
        >
          <IconTrendingUp className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
          Новые
        </Badge>
      ),
    },
    {
      title: "Отклики на вакансию",
      value: avgResponsesPerVacancy,
      description: `${responseQuality.label} активность`,
      icon: IconChartBar,
      color:
        RESPONSE_QUALITY_CLASSES[responseQuality.color]?.text ??
        "text-blue-600",
      bg:
        RESPONSE_QUALITY_CLASSES[responseQuality.color]?.bg ?? "bg-blue-500/10",
      tooltip: "Среднее количество откликов на одну активную вакансию",
      action: (
        <Badge
          variant="outline"
          className={cn(
            "border-none px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0",
            `${RESPONSE_QUALITY_CLASSES[responseQuality.color]?.bg ?? "bg-blue-500/10"} ${RESPONSE_QUALITY_CLASSES[responseQuality.color]?.badge ?? "text-blue-700"}`,
          )}
        >
          {responseQuality.label}
        </Badge>
      ),
    },
    {
      title: "Закрытые вакансии",
      value: closedVacancies,
      description: `${closedPercentage}% успешно закрыты`,
      icon: IconUserCheck,
      color: "text-green-600",
      bg: "bg-green-500/10",
      tooltip: "Вакансии, по которым найдены кандидаты",
      action: closedVacancies > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-green-500/10 text-green-700 px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0"
        >
          <IconTrendingUp className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
          {closedPercentage}%
        </Badge>
      ),
    },
    ...(avgTimeToClose
      ? [
          {
            title: "Время закрытия",
            value: avgTimeToClose,
            description: `${timeQuality?.label || "Среднее"} время`,
            icon: IconClock,
            color:
              TIME_QUALITY_CLASSES[timeQuality?.color || "blue"]?.text ??
              "text-blue-600",
            bg:
              TIME_QUALITY_CLASSES[timeQuality?.color || "blue"]?.bg ??
              "bg-blue-500/10",
            tooltip: "Среднее время от публикации до закрытия вакансии",
            suffix: "дн.",
            action: timeQuality && (
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0",
                  `${TIME_QUALITY_CLASSES[timeQuality.color]?.bg ?? "bg-blue-500/10"} ${TIME_QUALITY_CLASSES[timeQuality.color]?.badge ?? "text-blue-700"}`,
                )}
              >
                {timeQuality.label}
              </Badge>
            ),
          },
        ]
      : []),
    ...(conversionRate !== undefined
      ? [
          {
            title: "Конверсия в найм",
            value: conversionRate,
            description: "от откликов до найма",
            icon: IconUsers,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
            tooltip: "Процент откликов, которые привели к успешному найму",
            suffix: "%",
            action: conversionRate > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-1 text-[10px] @sm/card:px-1.5 @sm/card:text-xs shrink-0",
                  conversionRate >= 5
                    ? "bg-emerald-500/10 text-emerald-700"
                    : conversionRate >= 2
                      ? "bg-blue-500/10 text-blue-700"
                      : "bg-orange-500/10 text-orange-700",
                )}
              >
                {conversionRate >= 5 ? (
                  <IconTrendingUp className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
                ) : (
                  <IconTrendingDown className="size-3 @sm/card:size-3.5 mr-0.5 @sm/card:mr-1" />
                )}
                {conversionRate >= 5
                  ? "Отлично"
                  : conversionRate >= 2
                    ? "Хорошо"
                    : "Можно лучше"}
              </Badge>
            ),
          },
        ]
      : []),
  ];
  return (
    <div className="grid grid-cols-1 min-[200px]:grid-cols-2 gap-2 sm:gap-3 @xl/main:grid-cols-3 @3xl/main:grid-cols-4 @5xl/main:grid-cols-6">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="group relative overflow-hidden border-none bg-card shadow-sm transition-all hover:shadow-md @container/card"
          title={stat.tooltip}
        >
          <div
            className={cn(
              "absolute right-0 top-0 -mr-2 -mt-2 size-10 opacity-10 transition-transform group-hover:scale-110 @sm/card:size-12 @md/card:-mr-3 @md/card:-mt-3 @md/card:size-16 transform rounded-full",
              stat.bg,
            )}
          />
          <CardHeader className="p-2.5 @sm/card:p-3 @md/card:p-4 @md/card:pb-3">
            <div className="flex flex-col gap-1.5 @sm/card:flex-row @sm/card:items-start @sm/card:justify-between @sm/card:gap-2">
              <div className="flex-1 min-w-0">
                <CardDescription className="text-[9px] @sm/card:text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5 @sm/card:mb-1.5 truncate">
                  {stat.title}
                </CardDescription>
                <CardTitle className="text-lg @sm/card:text-xl @md/card:text-2xl font-bold tracking-tight break-words">
                  {stat.value?.toLocaleString() ?? 0}
                  {stat.suffix && stat.value && stat.value > 0 && (
                    <span className="ml-0.5 text-xs @sm/card:text-sm text-muted-foreground whitespace-nowrap">
                      {stat.suffix}
                    </span>
                  )}
                </CardTitle>
                <p className="text-[10px] @sm/card:text-xs text-muted-foreground mt-0.5 @sm/card:mt-1 line-clamp-2">
                  {stat.description}
                </p>
              </div>
              <div className="flex flex-row items-center gap-1.5 @sm/card:flex-col @sm/card:items-end @sm/card:shrink-0">
                <stat.icon
                  className={cn(
                    "size-3.5 @sm/card:size-4 shrink-0",
                    stat.color,
                  )}
                />
                {stat.action}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
