"use client";

import { paths } from "@qbs-autonaim/config";
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
import { Briefcase, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

export function ActiveVacancies({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug: string;
}) {
  const orpc = useORPC();
  const { workspace } = useWorkspace();

  const { data: vacancies, isLoading } = useQuery(
    orpc.vacancy.listActive.queryOptions({
      input: {
        limit: 5,
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
    }),
  );

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Вакансии в работе</CardTitle>
          <CardDescription>Открытые позиции</CardDescription>
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

  if (!vacancies || vacancies.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Вакансии в работе</CardTitle>
          <CardDescription>Открытые позиции</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Briefcase className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Нет активных вакансий</EmptyTitle>
              <EmptyDescription>
                Создайте вакансию, чтобы начать получать отклики.{" "}
                <Link
                  href={paths.workspace.vacancies(orgSlug, workspaceSlug)}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  К вакансиям
                </Link>
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
        <CardTitle>Вакансии в работе</CardTitle>
        <CardDescription>С новыми откликами — в приоритете</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...(vacancies ?? [])]
            .sort((a, b) => {
              const aNew = a.newResponses ?? 0;
              const bNew = b.newResponses ?? 0;
              if (aNew > 0 && bNew === 0) return -1;
              if (aNew === 0 && bNew > 0) return 1;
              return (b.responses ?? 0) - (a.responses ?? 0);
            })
            .map((vacancy) => (
              <Item key={vacancy.id} asChild variant="outline" size="sm">
                <Link
                  href={paths.workspace.vacancies(
                    orgSlug,
                    workspaceSlug,
                    vacancy.id,
                  )}
                >
                  <ItemMedia
                    variant="icon"
                    className="size-10 rounded-full bg-primary/10 [&_svg]:size-5 [&_svg]:text-primary"
                  >
                    <Briefcase />
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className="truncate">
                        {vacancy.title}
                      </ItemTitle>
                    </ItemHeader>
                    <ItemDescription className="text-xs">
                      {vacancy.responses ?? 0} откликов
                      {vacancy.newResponses && vacancy.newResponses > 0 ? (
                        <span className="text-primary font-medium ml-1">
                          (+{vacancy.newResponses} новых)
                        </span>
                      ) : null}
                    </ItemDescription>
                  </ItemContent>
                  {vacancy.url && (
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </Link>
              </Item>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
