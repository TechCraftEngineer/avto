"use client";

import { paths } from "@qbs-autonaim/config";
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
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconDots,
  IconEdit,
  IconExternalLink,
  IconHistory,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

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
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  HH: {
    label: "HeadHunter",
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
  KWORK: {
    label: "Kwork",
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  FL_RU: {
    label: "FL.ru",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  FREELANCE_RU: {
    label: "Freelance.ru",
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  AVITO: {
    label: "Avito",
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  SUPERJOB: {
    label: "SuperJob",
    color: "bg-sky-500/10 text-sky-600 border-sky-200",
  },
  HABR: {
    label: "Хабр Карьера",
    color: "bg-zinc-500/10 text-zinc-600 border-zinc-200",
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
}: VacancyTableRowProps) {
  const source = SOURCE_CONFIG[vacancy.source] || {
    label: vacancy.source,
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  // Валидируем и санитизируем URL платформы
  const safePlatformUrl = sanitizeUrl(vacancy.platformUrl);

  return (
    <TableRow className="group transition-colors hover:bg-muted/50">
      <TableCell className="max-w-[300px]">
        <div className="flex flex-col gap-0.5">
          <Link
            href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {vacancy.title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
            <span>{source.label}</span>
            {vacancy.region && (
              <>
                <span>•</span>
                <span>{vacancy.region}</span>
              </>
            )}
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
          {vacancy.region || "—"}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">
        {vacancy.views?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <Link
          href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline group-hover:bg-primary/5 px-2 py-1 rounded-md transition-all"
        >
          <IconUsers className="size-4" />
          {vacancy.totalResponsesCount ?? 0}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        {vacancy.newResponses && vacancy.newResponses > 0 ? (
          <div className="flex justify-end">
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700 shadow-sm animate-in fade-in zoom-in duration-300"
            >
              +{vacancy.newResponses}
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums hidden md:table-cell text-muted-foreground">
        {vacancy.resumesInProgress ?? "—"}
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
            {vacancy.isActive ? "Активна" : "Неактивна"}
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
                      "edit",
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
