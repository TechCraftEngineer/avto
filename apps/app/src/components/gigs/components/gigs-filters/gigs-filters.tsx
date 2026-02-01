import {
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
  IconLayoutList,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

export type DisplayMode = "grid" | "list" | "compact";

export const gigTypeLabels: Record<string, string> = {
  DEVELOPMENT: "Разработка",
  DESIGN: "Дизайн",
  COPYWRITING: "Копирайтинг",
  MARKETING: "Маркетинг",
  TRANSLATION: "Перевод",
  VIDEO: "Видео",
  AUDIO: "Аудио",
  DATA_ENTRY: "Ввод данных",
  RESEARCH: "Исследования",
  CONSULTING: "Консалтинг",
  OTHER: "Другое",
};

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
  orgSlug: string;
  workspaceSlug: string;
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
  orgSlug,
  workspaceSlug,
}: GigsFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            className="pl-9"
            aria-label="Поиск заданий"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Переключатель режима отображения */}
          <div className="flex items-center border rounded-md p-1 bg-muted/50">
            <Button
              variant={displayMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDisplayModeChange("grid")}
              className="h-8 px-2"
            >
              <IconLayoutGrid className="size-4" />
            </Button>
            <Button
              variant={displayMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDisplayModeChange("list")}
              className="h-8 px-2"
            >
              <IconLayoutList className="size-4" />
            </Button>
          </div>

          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger
              className="w-full sm:w-[160px]"
              aria-label="Фильтр по типу"
            >
              <IconFilter className="size-4" aria-hidden="true" />
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {Object.entries(gigTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
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
              <SelectItem value="deadline">По дедлайну</SelectItem>
              <SelectItem value="responses">По откликам</SelectItem>
              <SelectItem value="newResponses">По новым</SelectItem>
              <SelectItem value="title">По названию</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex w-full gap-2 md:w-auto">
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
  );
}
