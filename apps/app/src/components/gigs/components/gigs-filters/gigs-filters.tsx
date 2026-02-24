import { Button } from "@qbs-autonaim/ui/components/button";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qbs-autonaim/ui/components/toggle-group";
import { Filter, LayoutGrid, Search, Sparkles, Table2 } from "lucide-react";
import Link from "next/link";
import { type DisplayMode, gigTypesConfig } from "../gig-config";

// Константы для фильтров
const DEADLINE_WARNING_DAYS = 7;
const QUICK_FILTER_LABELS = {
  NEEDS_ATTENTION: "Нужно внимание",
  HAS_NEW_RESPONSES: "С новыми откликами",
  DEADLINE_SOON: `Истекают за ${DEADLINE_WARNING_DAYS} дн.`,
} as const;

export const quickFilterOptions = [
  { value: "", label: "Все" },
  { value: "needsAttention", label: QUICK_FILTER_LABELS.NEEDS_ATTENTION },
  { value: "hasNewResponses", label: QUICK_FILTER_LABELS.HAS_NEW_RESPONSES },
  { value: "deadlineSoon", label: QUICK_FILTER_LABELS.DEADLINE_SOON },
] as const;

interface GigsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
  groupBy: "none" | "urgency";
  onGroupByChange: (value: "none" | "urgency") => void;
  orgSlug: string;
  workspaceSlug: string;
  newResponsesCount?: number;
}

export function GigsFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  displayMode,
  onDisplayModeChange,
  quickFilter,
  onQuickFilterChange,
  groupBy,
  onGroupByChange,
  orgSlug,
  workspaceSlug,
  newResponsesCount = 0,
}: GigsFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Поиск по названию…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Поиск заданий"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <ToggleGroup
              type="single"
              value={displayMode}
              onValueChange={(v) =>
                v && onDisplayModeChange(v as "grid" | "table")
              }
              variant="outline"
              size="sm"
              spacing={0}
              className="w-fit"
            >
              <ToggleGroupItem value="grid" title="Карточки">
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" title="Таблица">
                <Table2 className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger
                className="w-full sm:w-[160px]"
                aria-label="Фильтр по типу"
              >
                <Filter className="size-4" aria-hidden />
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {gigTypesConfig.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger
                className="w-full sm:w-[140px]"
                aria-label="Фильтр по статусу"
              >
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger
                className="w-full sm:w-[160px]"
                aria-label="Сортировка"
              >
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">По дате</SelectItem>
                <SelectItem value="urgency">По срочности</SelectItem>
                <SelectItem value="deadline">По дедлайну</SelectItem>
                <SelectItem value="responses">По откликам</SelectItem>
                <SelectItem value="newResponses">По новым</SelectItem>
                <SelectItem value="title">По названию</SelectItem>
                <SelectItem value="budgetMin">По бюджету (мин.)</SelectItem>
                <SelectItem value="budgetMax">По бюджету (макс.)</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={groupBy}
              onValueChange={(v) =>
                v && onGroupByChange(v as "none" | "urgency")
              }
              variant="outline"
              size="sm"
              spacing={0}
              className="w-fit"
            >
              <ToggleGroupItem value="none" title="Без группировки">
                Группа
              </ToggleGroupItem>
              <ToggleGroupItem value="urgency" title="По срочности">
                По срочности
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 md:w-auto md:shrink-0">
          <Button asChild variant="outline" className="flex-1 md:flex-initial">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/import`}
              aria-label="Импорт проектов"
            >
              Импорт проектов
            </Link>
          </Button>
          <Button asChild variant="default" className="flex-1 md:flex-initial">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/create`}
              aria-label="Создать разовое задание"
            >
              <Sparkles className="size-4" aria-hidden />
              Создать задание
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Быстро:</span>
        <ToggleGroup
          type="single"
          value={quickFilter || "all"}
          onValueChange={(v) =>
            onQuickFilterChange(v === "all" ? "" : (v ?? ""))
          }
          variant="outline"
          size="sm"
          className="w-fit flex-wrap"
        >
          <ToggleGroupItem value="all">Все</ToggleGroupItem>
          {quickFilterOptions.map(
            (opt) =>
              opt.value && (
                <ToggleGroupItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.value === "hasNewResponses" && newResponsesCount > 0 && (
                    <span className="ml-1.5 rounded-md bg-primary/15 px-1.5 py-0.5 text-xs tabular-nums">
                      {newResponsesCount}
                    </span>
                  )}
                </ToggleGroupItem>
              ),
          )}
        </ToggleGroup>
      </div>
    </div>
  );
}
