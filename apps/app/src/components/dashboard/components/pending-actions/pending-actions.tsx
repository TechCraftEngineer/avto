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
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useWorkspace } from "~/hooks/use-workspace";
import { getAvatarUrl } from "~/lib/avatar";
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
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Требуют внимания
          </CardTitle>
          <CardDescription>Необработанные отклики</CardDescription>
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

  if (isError) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Требуют внимания
          </CardTitle>
          <CardDescription>Ошибка загрузки откликов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Не удалось загрузить отклики
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || "Произошла ошибка при загрузке данных"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingResponses.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-500" />
            Требуют внимания
          </CardTitle>
          <CardDescription>Необработанные отклики</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Все отклики обработаны
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Отличная работа! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Требуют внимания
        </CardTitle>
        <CardDescription>
          {pendingResponses.length} необработанных откликов
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
      className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-3 transition-colors hover:bg-orange-100/50 dark:border-orange-900/50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
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
          <Badge
            variant="outline"
            className="h-5 border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400"
          >
            Новый
          </Badge>
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
