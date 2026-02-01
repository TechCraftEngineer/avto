"use client";

import { paths, ROUTE_SEGMENTS } from "@qbs-autonaim/config";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconDots,
  IconEdit,
  IconExternalLink,
  IconHistory,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { VacancyPerformanceBadge } from "./vacancy-performance-badge";

/**
 * Валидирует и санитизирует URL, разрешая только http и https схемы
 * @param url - URL для валидации
 * @returns Безопасный URL или null если URL невалиден или использует запрещенную схему
 */
function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    // Разрешаем только http и https схемы
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
    return null;
  } catch {
    // Невалидный URL
    return null;
  }
}

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
  platformUrl?: string | null;
}

interface VacancyTableRowProps {
  vacancy: Vacancy;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string | undefined;
  allVacancies: Vacancy[];
  mergeOpenVacancyId: string | null;
  mergeTargetVacancyId: string;
  onMergeOpen: (vacancyId: string) => void;
  onMergeClose: () => void;
  onMergeTargetChange: (vacancyId: string) => void;
  onMergeConfirm: (sourceId: string, targetId: string) => void;
  isMerging: boolean;
  onDeleteOpen: (vacancyId: string, vacancyTitle: string) => void;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  HH: {
    label: "HeadHunter",
    color: "bg-indigo-500/10 text-indigo-700 border-indigo-200/50",
  },
  FL_RU: {
    label: "FL.ru",
    color: "bg-blue-500/10 text-blue-700 border-blue-200/50",
  },
  FREELANCE_RU: {
    label: "Freelance.ru",
    color: "bg-amber-500/10 text-amber-700 border-amber-200/50",
  },
  AVITO: {
    label: "Avito",
    color: "bg-violet-500/10 text-violet-700 border-violet-200/50",
  },
  SUPERJOB: {
    label: "SuperJob",
    color: "bg-cyan-500/10 text-cyan-700 border-cyan-200/50",
  },
  HABR: {
    label: "Хабр Карьера",
    color: "bg-slate-500/10 text-slate-700 border-slate-200/50",
  },
};

export function VacancyTableRow({
  vacancy,
  orgSlug,
  workspaceSlug,
  workspaceId,
  allVacancies,
  mergeOpenVacancyId,
  mergeTargetVacancyId,
  onMergeOpen,
  onMergeClose,
  onMergeTargetChange,
  onMergeConfirm,
  isMerging,
  onDeleteOpen,
}: VacancyTableRowProps) {
  const source = SOURCE_CONFIG[vacancy.source] || {
    label: vacancy.source,
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  // Валидируем и санитизируем URL платформы
  const safePlatformUrl = sanitizeUrl(vacancy.platformUrl);

  // Вычисляем конверсию просмотров в отклики
  const conversionRate =
    vacancy.views && vacancy.views > 0 && vacancy.totalResponsesCount
      ? ((vacancy.totalResponsesCount / vacancy.views) * 100).toFixed(1)
      : null;

  // Определяем приоритет вакансии для рекрутера
  const needsAttention = vacancy.newResponses && vacancy.newResponses > 0;

  return (
    <TableRow
      className={`group transition-colors hover:bg-muted/50 ${
        needsAttention ? "bg-green-50/50 dark:bg-green-950/10" : ""
      }`}
    >
      <TableCell className="max-w-[280px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Link
                  href={paths.workspace.vacancies(
                    orgSlug,
                    workspaceSlug,
                    vacancy.id,
                  )}
                  className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                >
                  {vacancy.title}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-[400px] text-sm"
              >
                {vacancy.title}
              </TooltipContent>
            </Tooltip>
            {needsAttention && (
              <div
                className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse shrink-0 mt-1.5"
                title="Есть новые отклики"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <VacancyPerformanceBadge
              views={vacancy.views}
              responses={vacancy.totalResponsesCount}
              className="text-[10px] px-1.5 py-0"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
              <span>{source.label}</span>
              {vacancy.workLocation && (
                <>
                  <span>•</span>
                  <span>{vacancy.workLocation}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`font-medium ${source.color} border border-transparent`}
        >
          {source.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        <span className="truncate block max-w-[150px]">
          {vacancy.workLocation || "—"}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <Link
          href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
          className="inline-flex items-center justify-end gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
        >
          {vacancy.totalResponsesCount ?? 0}
        </Link>
        {conversionRate && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {conversionRate}% конверсия
          </div>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {vacancy.newResponses && vacancy.newResponses > 0 ? (
          <Link
            href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
            className="inline-flex items-center justify-end gap-1.5"
          >
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700 shadow-sm font-semibold tabular-nums"
            >
              +{vacancy.newResponses}
            </Badge>
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums hidden md:table-cell">
        {vacancy.resumesInProgress && vacancy.resumesInProgress > 0 ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-medium text-foreground">
              {vacancy.resumesInProgress}
            </span>
            {vacancy.totalResponsesCount && vacancy.totalResponsesCount > 0 && (
              <span className="text-xs text-muted-foreground">
                из {vacancy.totalResponsesCount}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">
        {vacancy.views?.toLocaleString() ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${
              vacancy.isActive
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                : "bg-zinc-300"
            }`}
          />
          <span className="text-sm font-medium">
            {vacancy.isActive ? "Активна" : "Закрыта"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Popover
            open={mergeOpenVacancyId === vacancy.id}
            onOpenChange={(open) => {
              if (open) {
                onMergeOpen(vacancy.id);
              } else {
                onMergeClose();
              }
            }}
          >
            <DropdownMenu>
              <PopoverAnchor asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 group-hover:bg-background"
                    aria-label="Действия"
                  >
                    <IconDots className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </PopoverAnchor>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancy.id,
                    )}
                    className="cursor-pointer"
                  >
                    <IconBriefcase className="mr-2 size-4" />
                    Открыть вакансию
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug,
                      workspaceSlug,
                      vacancy.id,
                      ROUTE_SEGMENTS.vacancy.edit,
                    )}
                    className="cursor-pointer"
                  >
                    <IconEdit className="mr-2 size-4" />
                    Редактировать
                  </Link>
                </DropdownMenuItem>
                {safePlatformUrl ? (
                  <DropdownMenuItem asChild>
                    <a
                      href={safePlatformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <IconExternalLink className="mr-2 size-4" />
                      На платформе
                    </a>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem disabled>
                  <IconHistory className="mr-2 size-4" />
                  История изменений
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-primary focus:text-primary"
                  onSelect={() => onMergeOpen(vacancy.id)}
                >
                  Сдружить с другой…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDeleteOpen(vacancy.id, vacancy.title)}
                >
                  <IconTrash className="mr-2 size-4" />
                  Удалить вакансию
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <PopoverContent align="end" className="w-[320px]">
              <div className="space-y-3">
                <div className="text-sm font-medium">Основная вакансия</div>
                <Select
                  value={mergeTargetVacancyId}
                  onValueChange={onMergeTargetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите вакансию" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVacancies
                      .filter((v) => v.id !== vacancy.id)
                      .map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={onMergeClose}>
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      !workspaceId || !mergeTargetVacancyId || isMerging
                    }
                    onClick={() => {
                      if (!workspaceId || !mergeTargetVacancyId) return;
                      onMergeConfirm(vacancy.id, mergeTargetVacancyId);
                    }}
                  >
                    Подтвердить
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TableCell>
    </TableRow>
  );
}
