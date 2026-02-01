import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@qbs-autonaim/ui";
import { Briefcase, Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { STAGES } from "./constants";
import type { FunnelStage } from "./types";

interface PipelineToolbarProps {
  selectedVacancy: string;
  onVacancyChange: (value: string) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  filterStages: FunnelStage[];
  onToggleStageFilter: (stageId: FunnelStage) => void;
  onClearStageFilters: () => void;
  vacancies?: Array<{ id: string; title: string }>;
}

export function PipelineToolbar({
  selectedVacancy,
  onVacancyChange,
  searchText,
  onSearchChange,
  filterStages,
  onToggleStageFilter,
  onClearStageFilters,
  vacancies,
}: PipelineToolbarProps) {
  return (
    <div className="flex-shrink-0 mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6">
      <div className="flex flex-col gap-3 p-3 sm:p-4 md:p-5 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-1">
            <Select value={selectedVacancy} onValueChange={onVacancyChange}>
              <SelectTrigger className="w-full sm:w-[240px] md:w-[280px] h-10 gap-2 bg-background">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Все вакансии" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все вакансии</SelectItem>
                {vacancies?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Separator orientation="vertical" className="hidden sm:block h-8" />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, должности, навыкам…"
                className="pl-9 h-10 bg-background"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Поиск кандидатов"
                type="search"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Фильтры</span>
                  {filterStages.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1.5 py-0.5 h-5 text-[10px] min-w-5 justify-center text-foreground font-semibold"
                    >
                      {filterStages.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-foreground">
                      Статус
                    </h4>
                    {filterStages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={onClearStageFilters}
                      >
                        Сбросить
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {STAGES.map((stage) => (
                      <div
                        key={stage.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`filter-${stage.id}`}
                          checked={filterStages.includes(stage.id)}
                          onCheckedChange={() => onToggleStageFilter(stage.id)}
                        />
                        <Label
                          htmlFor={`filter-${stage.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {stage.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button size="sm" className="gap-2 h-10 px-4" disabled>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
