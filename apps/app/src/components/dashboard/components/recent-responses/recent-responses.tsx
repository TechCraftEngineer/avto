"use client";

import { paths } from "@qbs-autonaim/config";
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Star } from "lucide-react";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useWorkspace } from "~/hooks/use-workspace";
import { getAvatarUrl } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";
import type { VacancyResponseRecentItem } from "~/types/api";


type RecentResponse =
  VacancyResponseRecentItem;

interface RecentResponseItemProps {
  response: RecentResponse;
  orgSlug: string;
  workspaceSlug: string;
}

function RecentResponseItem({
  response,
  orgSlug,
  workspaceSlug,
}: RecentResponseItemProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");

  return (
    <Link
      href={
        response.vacancy?.id
          ? paths.workspace.vacancyResponse(
              orgSlug,
              workspaceSlug,
              response.vacancy.id,
              response.id,
            )
          : paths.workspace.responses(orgSlug, workspaceSlug, response.id)
      }
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <CandidateAvatar
        name={response.candidateName}
        photoUrl={avatarUrl}
        className="h-10 w-10"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">
            {response.candidateName || "Без имени"}
          </p>
          {response.screening && (
            <Badge variant="outline" className="h-5 px-1.5">
              <Star className="h-3 w-3 mr-1" />
              {response.screening.overallScore.toFixed(1)}
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
  );
}

export function RecentResponses({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug: string;
}) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  const { data: recentResponses, isLoading } = useQuery({
    ...trpc.vacancy.responses.listRecent.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Последние отклики</CardTitle>
          <CardDescription>Недавно полученные отклики</CardDescription>
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

  if (recentResponses?.length === 0)
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Последние отклики</CardTitle>
          <CardDescription>Недавно полученные отклики</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Пока нет откликов на вакансии
            </p>
          </div>
        </CardContent>
      </Card>
    );

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Последние отклики</CardTitle>
        <CardDescription>Недавно полученные отклики</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentResponses?.map((response) => (
            <RecentResponseItem
              key={response.id}
              response={response}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
