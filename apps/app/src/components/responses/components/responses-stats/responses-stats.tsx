"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import {
  IconInfoCircle,
  IconMessageCircle,
  IconSparkles,
  IconStar,
  IconUserCheck,
} from "@tabler/icons-react";

interface ResponsesStatsProps {
  totalResponses: number;
  evaluatedResponses: number;
  highScoreResponses: number;
  interviewResponses: number;
  isLoading?: boolean;
}

export function ResponsesStats({
  totalResponses,
  evaluatedResponses,
  highScoreResponses,
  interviewResponses,
  isLoading,
}: ResponsesStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => `skeleton-${index}`).map(
          (key) => (
            <Card key={key} className="animate-pulse border-none bg-muted/20">
              <CardHeader className="h-[120px]" />
            </Card>
          ),
        )}
      </div>
    );
  }

  const highScorePercentage =
    evaluatedResponses > 0
      ? Math.round((highScoreResponses / evaluatedResponses) * 100)
      : 0;

  const pendingReview = totalResponses - evaluatedResponses;
  const conversionRate =
    totalResponses > 0
      ? Math.round((interviewResponses / totalResponses) * 100)
      : 0;

  const stats = [
    {
      title: "Всего откликов",
      value: totalResponses,
      description: "на все вакансии",
      tooltip: "Общее количество откликов от кандидатов на ваши вакансии",
      icon: IconMessageCircle,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Требуют проверки",
      value: pendingReview,
      description: `${totalResponses - evaluatedResponses} не оценено`,
      tooltip:
        "Отклики, которые ещё не прошли автоматическую оценку. Рекомендуем начать с них",
      icon: IconSparkles,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
      highlight: pendingReview > 0,
      action: pendingReview > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-orange-500/10 text-orange-700 px-1.5 animate-pulse"
        >
          Новые
        </Badge>
      ),
    },
    {
      title: "Перспективные",
      value: highScoreResponses,
      description: `${highScorePercentage}% от оценённых`,
      tooltip:
        "Кандидаты с высокой оценкой (4+ балла). Приоритетные для рассмотрения",
      icon: IconStar,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      action: highScorePercentage > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-amber-500/10 text-amber-700 px-1.5"
        >
          {highScorePercentage}%
        </Badge>
      ),
    },
    {
      title: "На собеседовании",
      value: interviewResponses,
      description: `конверсия ${conversionRate}%`,
      tooltip:
        "Кандидаты, которые проходят или прошли интервью. Показывает эффективность отбора",
      icon: IconUserCheck,
      color: "text-green-600",
      bg: "bg-green-500/10",
      action: conversionRate > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-green-500/10 text-green-700 px-1.5"
        >
          {conversionRate}%
        </Badge>
      ),
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              "group relative overflow-hidden border-none bg-card shadow-sm transition-all hover:shadow-md",
              stat.highlight && "ring-2 ring-orange-500/20",
            )}
          >
            <div
              className={cn(
                "absolute right-0 top-0 -mr-4 -mt-4 size-24 transform rounded-full opacity-10 transition-transform group-hover:scale-110",
                stat.bg,
              )}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn("size-5", stat.color)} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        <IconInfoCircle className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{stat.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {stat.action}
              </div>
              <CardTitle className="mt-4 text-3xl font-bold tracking-tight">
                {stat.value.toLocaleString()}
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                {stat.title}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
