"use client";

import { Badge, Button, TableCell, TableRow } from "@qbs-autonaim/ui";
import { IconDots } from "@tabler/icons-react";
import Link from "next/link";
import { useVacancyStats } from "~/hooks/use-vacancy-stats";

interface Vacancy {
  id: string;
  title: string;
  source: string;
  region: string | null;
  workLocation: string | null;
  views: number | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
  isActive: boolean | null;
}

interface VacancyTableRowRealtimeProps {
  vacancy: Vacancy;
  orgSlug: string;
  workspaceSlug: string;
}

/**
 * Строка таблицы вакансий с realtime обновлениями
 * Автоматически обновляет статистику без перезагрузки страницы
 */
export function VacancyTableRowRealtime({
  vacancy,
  orgSlug,
  workspaceSlug,
}: VacancyTableRowRealtimeProps) {
  // Подключаем realtime обновления
  const { stats } = useVacancyStats(vacancy.id);

  // Используем realtime данные если доступны, иначе начальные значения
  const views = stats?.views ?? vacancy.views;
  const totalResponses =
    stats?.totalResponsesCount ?? vacancy.totalResponsesCount;
  const newResponses = stats?.newResponses ?? vacancy.newResponses;
  const resumesInProgress =
    stats?.resumesInProgress ?? vacancy.resumesInProgress;
  const isActive = stats?.isActive ?? vacancy.isActive;

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancy.id}`}
          className="font-medium hover:underline"
        >
          {vacancy.title}
        </Link>
        <div className="text-xs text-muted-foreground">
          {vacancy.workLocation || vacancy.region}
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline">{vacancy.source}</Badge>
      </TableCell>

      <TableCell className="hidden md:table-cell">{vacancy.region}</TableCell>

      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="font-medium">{totalResponses ?? 0}</span>
          {totalResponses && totalResponses > 0 && (
            <span className="text-xs text-muted-foreground">
              всего откликов
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        {newResponses && newResponses > 0 ? (
          <Badge variant="default" className="animate-pulse">
            {newResponses}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="hidden text-right md:table-cell">
        <div className="flex flex-col items-end gap-1">
          <span className="font-medium">{resumesInProgress ?? 0}</span>
          {resumesInProgress && resumesInProgress > 0 && (
            <span className="text-xs text-muted-foreground">в работе</span>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden text-right lg:table-cell">
        {views ?? 0}
      </TableCell>

      <TableCell>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Активна" : "Неактивна"}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <Button variant="ghost" size="icon" aria-label="Открыть действия вакансии">
          <IconDots className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
