"use client";

import { paths } from "@qbs-autonaim/config";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@qbs-autonaim/ui/components/item";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useWorkspace } from "~/hooks/use-workspace";
import { getAvatarUrl } from "~/lib/avatar";
import { ruNoAbout } from "~/lib/date-locale-ru-no-about";
import { useORPC } from "~/orpc/react";
import type { VacancyResponseNeedsReviewItem } from "~/types/api";

type NeedsReviewResponse = VacancyResponseNeedsReviewItem;

interface NeedsReviewResponseItemProps {
  response: NeedsReviewResponse;
  orgSlug: string;
  workspaceSlug: string;
}

function NeedsReviewResponseItem({
  response,
  orgSlug,
  workspaceSlug,
}: NeedsReviewResponseItemProps) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");

  return (
    <Item asChild variant="outline" size="sm">
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
      >
        <ItemMedia variant="image">
          <CandidateAvatar
            name={response.candidateName}
            photoUrl={avatarUrl}
            className="size-10"
          />
        </ItemMedia>
        <ItemContent>
          <ItemHeader>
            <ItemTitle>{response.candidateName || "Без имени"}</ItemTitle>
            {response.screening && (
              <Badge variant="outline" className="gap-1">
                <Star className="size-3" />
                {response.screening.overallScore.toFixed(1)}
              </Badge>
            )}
          </ItemHeader>
          <ItemDescription>
            {response.vacancy?.title || "Вакансия"}
          </ItemDescription>
        </ItemContent>
        <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(response.createdAt), {
            addSuffix: true,
            locale: ruNoAbout,
          })}
        </span>
      </Link>
    </Item>
  );
}

export function RecentResponses({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug: string;
}) {
  const orpc = useORPC();
  const { workspace } = useWorkspace();

  const { data: needsReviewResponses, isLoading } = useQuery(
    orpc.vacancy.responses.listNeedsReview.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
        limit: 5,
      },
      enabled: !!workspace?.id,
    }),
  );

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>На рассмотрении</CardTitle>
          <CardDescription>
            Оценённые отклики, ожидающие решения
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => `skeleton-${index}`).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (needsReviewResponses?.length === 0) return null;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>На рассмотрении</CardTitle>
        <CardDescription>
          Оценённые отклики, ожидающие решения — пригласить или отклонить
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {needsReviewResponses?.map((response) => (
            <NeedsReviewResponseItem
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
