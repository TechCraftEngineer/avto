"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Badge,
  CandidateAvatar,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Award } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export function TopResponses({
  orgSlug,
  workspaceSlug,
  className,
}: {
  orgSlug: string;
  workspaceSlug: string;
  className?: string;
}) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  const { data: topResponses = [], isLoading } = useQuery({
    ...trpc.vacancy.responses.listTop.queryOptions({
      limit: 5,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  if (isLoading) {
    return (
      <Card className={cn("@container/card", className)}>
        <CardHeader>
          <CardTitle>Лучшие отклики</CardTitle>
          <CardDescription>Кандидаты с наивысшими оценками</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => `skeleton-${index}`).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border p-3 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topResponses.length === 0) {
    return (
      <Card className={cn("@container/card", className)}>
        <CardHeader>
          <CardTitle>Лучшие отклики</CardTitle>
          <CardDescription>Кандидаты с наивысшими оценками</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Пока нет оцененных откликов
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("@container/card", className)}>
      <CardHeader>
        <CardTitle>Лучшие отклики</CardTitle>
        <CardDescription>Кандидаты с наивысшими оценками</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topResponses.map((response, index) => (
            <Link
              key={response.id}
              href={
                response.vacancy?.id
                  ? paths.workspace.vacancyResponse(
                      orgSlug,
                      workspaceSlug,
                      response.vacancy.id,
                      response.id,
                    )
                  : paths.workspace.responses(
                      orgSlug,
                      workspaceSlug,
                      response.id,
                    )
              }
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="relative">
                <CandidateAvatar
                  name={response.candidateName}
                  photoUrl={
                    "photoUrl" in response &&
                    typeof response.photoUrl === "string"
                      ? response.photoUrl
                      : null
                  }
                  className="h-10 w-10"
                />
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {response.candidateName || "Без имени"}
                  </p>
                  {response.screening && (
                    <Badge
                      variant={index === 0 ? "default" : "outline"}
                      className="h-5 px-1.5"
                    >
                      {response.screening.detailedScore}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {response.vacancy?.title || "Вакансия"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(response.createdAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
