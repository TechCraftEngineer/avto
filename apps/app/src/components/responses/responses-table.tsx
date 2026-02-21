"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { RESPONSE_STATUS_LABELS } from "@qbs-autonaim/db/schema";
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@qbs-autonaim/ui/components/table";
import { InfoTooltip } from "@qbs-autonaim/ui/components/info-tooltip";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

type Response =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][number];

interface ResponsesTableProps {
  responses: Response[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  sortField: string | null;
  onSortChange: (
    field:
      | "createdAt"
      | "score"
      | "detailedScore"
      | "potentialScore"
      | "careerTrajectoryScore"
      | "priorityScore"
      | "status"
      | "respondedAt",
  ) => void;
  hasFilters: boolean;
}

export function ResponsesTable({
  responses,
  isLoading,
  orgSlug,
  workspaceSlug,
  sortField,
  onSortChange,
  hasFilters,
}: ResponsesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Кандидат</TableHead>
              <TableHead>Вакансия</TableHead>
              <TableHead>Оценка</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-card/50 text-center py-12">
        <p className="text-sm text-muted-foreground">
          {hasFilters ? "Отклики не найдены" : "Пока нет откликов"}
        </p>
      </div>
    );
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: typeof sortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() =>
        onSortChange(field as "createdAt" | "score" | "priorityScore")
      }
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Кандидат</TableHead>
            <TableHead>Вакансия</TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <SortButton field="score">Оценка</SortButton>
                <InfoTooltip content="Оценка соответствия кандидата требованиям вакансии на основе автоматического скрининга. Чем выше оценка, тем лучше кандидат подходит под требования." />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <SortButton field="priorityScore">Приоритет</SortButton>
                <InfoTooltip content="Приоритет обработки отклика (0-100). Учитывает соответствие требованиям (40%), свежесть отклика (20%), наличие скрининга (20%) и статус обработки (20%). Высокий приоритет означает, что отклик требует первоочередного внимания." />
              </div>
            </TableHead>
            <TableHead>
              <SortButton field="status">Статус</SortButton>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <SortButton field="respondedAt">Дата</SortButton>
                <InfoTooltip content="Дата и время, когда кандидат откликнулся на вакансию." />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response) => (
            <TableRow key={response.id}>
              <TableCell>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${response.entityId}/responses/${response.id}`}
                  className="font-medium hover:underline"
                >
                  {response.candidateName || "Без имени"}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${response.entityId}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Вакансия
                </Link>
              </TableCell>
              <TableCell>
                {response.screening?.score ? (
                  <Badge
                    variant={
                      response.screening.score >= 4 ? "default" : "secondary"
                    }
                  >
                    {response.screening.score.toFixed(1)}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {response.priorityScore ? (
                  <Badge variant="outline">
                    {response.priorityScore.toFixed(1)}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {RESPONSE_STATUS_LABELS[response.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {response.respondedAt
                  ? new Date(response.respondedAt).toLocaleDateString("ru-RU")
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
