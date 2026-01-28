"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
import {
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

  const evaluatedPercentage =
    totalResponses > 0
      ? Math.round((evaluatedResponses / totalResponses) * 100)
      : 0;

  const highScorePercentage =
    evaluatedResponses > 0
      ? Math.round((highScoreResponses / evaluatedResponses) * 100)
      : 0;

  const stats = [
    {
      title: "Всего откликов",
      value: totalResponses,
      description: "на все вакансии",
      icon: IconMessageCircle,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Оценено",
      value: evaluatedResponses,
      description: `${evaluatedPercentage}% от всех`,
      icon: IconSparkles,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      action: evaluatedPercentage > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-purple-500/10 text-purple-700 px-1.5"
        >
          {evaluatedPercentage}%
        </Badge>
      ),
    },
    {
      title: "Высокий балл",
      value: highScoreResponses,
      description: `${highScorePercentage}% оценённых`,
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
      title: "На интервью",
      value: interviewResponses,
      description: "активных собеседований",
      icon: IconUserCheck,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="group relative overflow-hidden border-none bg-card shadow-sm transition-all hover:shadow-md"
        >
          <div
            className={cn(
              "absolute right-0 top-0 -mr-4 -mt-4 size-24 transform rounded-full opacity-10 transition-transform group-hover:scale-110",
              stat.bg,
            )}
          />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <stat.icon className={cn("size-5", stat.color)} />
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
            <p className="text-sm text-muted-foreground">{stat.description}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
