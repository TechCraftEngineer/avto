"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

type Response =
  RouterOutputs["vacancy"]["responses"]["listAllWorkspace"]["responses"][number];

interface ResponsesTableProps {
  responses: Response[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  sortField: string | null;
  sortDirection: "asc" | "desc";
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
  sortDirection,
  onSortChange,
  hasFilters,
}: ResponsesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
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
              <TableRow key={i}>
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
      <div className="rounded-md border border-dashed bg-muted/20 text-center py-12">
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Кандидат</TableHead>
            <TableHead>Вакансия</TableHead>
            <TableHead>
              <SortButton field="score">Оценка</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="priorityScore">Приоритет</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Статус</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="respondedAt">Дата</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response) => (
            <TableRow key={response.id}>
              <TableCell>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${response.vacancyId}/responses/${response.id}`}
                  className="font-medium hover:underline"
                >
                  {response.candidateName || "Без имени"}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${response.vacancyId}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {response.vacancy?.title || "—"}
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
                <Badge variant="secondary">{response.status}</Badge>
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
