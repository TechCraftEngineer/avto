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
 * Строка таблицы вакансий
 */
export function VacancyTableRowRealtime({
  vacancy,
  orgSlug,
  workspaceSlug,
  workspaceId,
}: VacancyTableRowRealtimeProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Используем данные из пропсов
  const views = vacancy.views;
  const totalResponses = vacancy.totalResponsesCount;
  const newResponses = vacancy.newResponses;
  const resumesInProgress = vacancy.resumesInProgress;

  // Нормализуем статус вакансии с явной обработкой null/undefined
  const vacancyStatus = (() => {
    if (vacancy.isActive === true) {
      return {
        label: "Активна",
        toneClass: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]",
        tooltip: "Деактивировать вакансию",
        switchChecked: true,
      };
    }
    if (vacancy.isActive === false) {
      return {
        label: "Закрыта",
        toneClass: "bg-zinc-300",
        tooltip: "Активировать вакансию",
        switchChecked: false,
      };
    }
    // null или undefined означает архивный статус (специфично для HH)
    return {
      label: "Архив",
      toneClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
      tooltip: "Вакансия в архиве на платформе. Управление статусом недоступно",
      switchChecked: false,
    };
  })();

  const isArchived =
    vacancy.isActive === null || vacancy.isActive === undefined;

  // Мутация для обновления статуса вакансии
  const updateStatusMutation = useMutation(
    trpc.freelancePlatforms.updateVacancyStatus.mutationOptions({
      onSuccess: async () => {
        toast.success(
          vacancy.isActive
            ? "Вакансия деактивирована"
            : "Вакансия активирована",
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
    if (!workspaceId || isArchived) return;

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
                  checked={vacancyStatus.switchChecked}
                  onCheckedChange={handleStatusToggle}
                  disabled={updateStatusMutation.isPending || isArchived}
                  aria-label={vacancyStatus.tooltip}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-sm">
              {vacancyStatus.tooltip}
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <div
                  className={`size-2 rounded-full ${vacancyStatus.toneClass}`}
                />
                <span className="text-sm font-medium">
                  {vacancyStatus.label}
                </span>
              </div>
            </TooltipTrigger>
            {isArchived && (
              <TooltipContent side="top" className="max-w-xs text-sm">
                Вакансия находится в архиве на платформе HeadHunter. Изменение
                статуса возможно только через интерфейс платформы
              </TooltipContent>
            )}
          </Tooltip>
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
