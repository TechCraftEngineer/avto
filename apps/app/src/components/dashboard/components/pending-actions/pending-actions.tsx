"use client";

import { paths } from "@qbs-autonaim/config";
import { CandidateAvatar } from "@qbs-autonaim/ui/components/candidate-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@qbs-autonaim/ui/components/empty";
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
import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useWorkspace } from "~/hooks/use-workspace";
import { getAvatarUrl } from "~/lib/avatar";
import { ruNoAbout } from "~/lib/date-locale-ru-no-about";
import { useORPC } from "~/orpc/react";

interface PendingActionsProps {
  orgSlug: string;
  workspaceSlug: string;
}

export function PendingActions({
  orgSlug,
  workspaceSlug,
}: PendingActionsProps) {
  const orpc = useORPC();
  const { workspace } = useWorkspace();

  // Получаем необработанные отклики
  const {
    data: pendingResponses = [],
    isLoading,
    isError,
    error,
  } = useQuery(
    orpc.vacancy.responses.listRecent.queryOptions({
      input: {
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
      select: (data) =>
        data.filter((response) => !response.screening).slice(0, 5),
    }),
  );

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-24" />
          </CardTitle>
          <CardDescription>Отклики без скрининга</CardDescription>
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

  if (isError) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Оценить
          </CardTitle>
          <CardDescription>Ошибка загрузки откликов</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="size-6 text-destructive/70" />
              </EmptyMedia>
              <EmptyTitle>Не удалось загрузить отклики</EmptyTitle>
              <EmptyDescription>
                {error?.message || "Произошла ошибка при загрузке данных"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (pendingResponses.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-chart-2" />
            Оценить
          </CardTitle>
          <CardDescription>Отклики без скрининга</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Нечего оценивать</EmptyTitle>
              <EmptyDescription>
                Новые отклики появятся здесь. После скрининга подходящие попадут
                в «На рассмотрении»
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-chart-4" />
          Оценить
        </CardTitle>
        <CardDescription>
          {pendingResponses.length} откликов без оценки
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingResponses.map((response) => (
            <PendingResponseItem
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

function PendingResponseItem({
  response,
  orgSlug,
  workspaceSlug,
}: {
  response: {
    id: string;
    candidateName: string | null;
    photoFileId: string | null;
    createdAt: Date;
    vacancy: { id: string; title: string } | null;
  };
  orgSlug: string;
  workspaceSlug: string;
}) {
  const photoUrl = useAvatarUrl(response.photoFileId);
  const avatarUrl = getAvatarUrl(photoUrl, response.candidateName ?? "");

  return (
    <Item asChild variant="muted" size="sm">
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
