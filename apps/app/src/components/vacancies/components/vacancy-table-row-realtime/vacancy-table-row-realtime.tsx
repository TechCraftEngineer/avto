"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import { Switch } from "@qbs-autonaim/ui/switch";
import { TableCell, TableRow } from "@qbs-autonaim/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qbs-autonaim/ui/tooltip";
import { IconDots } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { useVacancyStats } from "~/hooks/use-vacancy-stats";
import { useTRPC } from "~/trpc/react";

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
  workspaceId?: string;
}

/**
 * Строка таблицы вакансий с realtime обновлениями
 * Автоматически обновляет статистику без перезагрузки страницы
 */
export function VacancyTableRowRealtime({
  vacancy,
  orgSlug,
  workspaceSlug,
  workspaceId,
}: VacancyTableRowRealtimeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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

  // Мутация для обновления статуса вакансии
  const updateStatusMutation = useMutation(
    trpc.freelancePlatforms.updateVacancyStatus.mutationOptions({
      onSuccess: async () => {
        toast.success(
          isActive ? "Вакансия деактивирована" : "Вакансия активирована",
        );
        await queryClient.invalidateQueries({
          queryKey: trpc.freelancePlatforms.getVacancies.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить статус вакансии");
      },
    }),
  );

  const handleStatusToggle = (checked: boolean) => {
    if (!workspaceId) return;

    updateStatusMutation.mutate({
      id: vacancy.id,
      workspaceId,
      status: checked ? "active" : "paused",
    });
  };

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
        <div className="flex items-center gap-3">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Switch
                  checked={isActive ?? false}
                  onCheckedChange={handleStatusToggle}
                  disabled={updateStatusMutation.isPending}
                  aria-label={
                    isActive
                      ? "Деактивировать вакансию"
                      : "Активировать вакансию"
                  }
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-sm">
              {isActive ? "Деактивировать вакансию" : "Активировать вакансию"}
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2">
            <div
              className={`size-2 rounded-full ${
                isActive
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                  : "bg-zinc-300"
              }`}
            />
            <span className="text-sm font-medium">
              {isActive ? "Активна" : "Закрыта"}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Открыть действия вакансии"
        >
          <IconDots className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
