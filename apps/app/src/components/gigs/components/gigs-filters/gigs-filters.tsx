import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import {
  IconFilter,
  IconLayoutGrid,
  IconSearch,
  IconSparkles,
  IconTable,
} from "@tabler/icons-react";
import Link from "next/link";
import { gigTypesConfig, gigTypeLabels, type DisplayMode } from "../gig-config";

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
            <IconSearch
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Поиск по названию…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-card shadow-sm"
              aria-label="Поиск заданий"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Переключатель режима отображения */}
            <div className="flex items-center rounded-md border bg-card shadow-sm p-1">
              <Button
                variant={displayMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onDisplayModeChange("grid")}
                className="h-8 px-2"
                title="Карточки"
              >
                <IconLayoutGrid className="size-4" />
              </Button>
              <Button
                variant={displayMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => onDisplayModeChange("table")}
                className="h-8 px-2"
                title="Таблица"
              >
                <IconTable className="size-4" />
              </Button>
            </div>

            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger
                className="w-full sm:w-[160px] bg-card shadow-sm"
                aria-label="Фильтр по типу"
              >
                <IconFilter className="size-4" aria-hidden="true" />
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
                className="w-full sm:w-[140px] bg-card shadow-sm"
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
                className="w-full sm:w-[160px] bg-card shadow-sm"
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

            <div className="flex items-center rounded-md border bg-card shadow-sm p-1">
              <Button
                variant={groupBy === "none" ? "ghost" : "default"}
                size="sm"
                onClick={() =>
                  onGroupByChange(groupBy === "none" ? "urgency" : "none")
                }
                className="h-8 px-2 text-xs"
                title={
                  groupBy === "urgency" ? "Снять группировку" : "По срочности"
                }
              >
                Группа
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-shrink-0">
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
              <IconSparkles className="size-4" aria-hidden="true" />
              Создать задание
            </Link>
          </Button>
        </div>
      </div>

      {/* Быстрые фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Быстро:</span>
        {quickFilterOptions.map(
          (opt) =>
            opt.value && (
              <Badge
                key={opt.value}
                variant={quickFilter === opt.value ? "default" : "outline"}
                className="cursor-pointer transition-colors hover:bg-muted/70"
                onClick={() =>
                  onQuickFilterChange(
                    quickFilter === opt.value ? "" : opt.value,
                  )
                }
              >
                {opt.label}
                {opt.value === "hasNewResponses" && newResponsesCount > 0 && (
                  <span className="ml-1 rounded bg-orange-200 px-1 text-xs dark:bg-orange-800">
                    {newResponsesCount}
                  </span>
                )}
              </Badge>
            ),
        )}
      </div>
    </div>
  );
}
