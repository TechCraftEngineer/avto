import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Filter } from "lucide-react";
import { MIN_SCORE_OPTIONS } from "./shortlist-constants";

interface ShortlistFiltersProps {
  selectedMinScore: string;
  includeOnlyHighlyRecommended: boolean;
  prioritizeBudgetFit: boolean;
  onMinScoreChange: (value: string) => void;
  onHighlyRecommendedChange: (checked: boolean) => void;
  onBudgetFitChange: (checked: boolean) => void;
  onReset: () => void;
}

export function ShortlistFilters({
  selectedMinScore,
  includeOnlyHighlyRecommended,
  prioritizeBudgetFit,
  onMinScoreChange,
  onHighlyRecommendedChange,
  onBudgetFitChange,
  onReset,
}: ShortlistFiltersProps) {
  const hasActiveFilters =
    selectedMinScore !== "70" ||
    includeOnlyHighlyRecommended ||
    prioritizeBudgetFit;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Настройки шортлиста
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="min-score-filter" className="text-sm font-medium">
              Минимальная оценка
            </label>
            <Select value={selectedMinScore} onValueChange={onMinScoreChange}>
              <SelectTrigger
                id="min-score-filter"
                className="min-h-[44px] sm:min-h-[36px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MIN_SCORE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">
              Только настоятельно рекомендованные
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="highly-recommended-filter"
                checked={includeOnlyHighlyRecommended}
                onCheckedChange={onHighlyRecommendedChange}
              />
              <label
                htmlFor="highly-recommended-filter"
                className="text-sm text-muted-foreground"
              >
                {includeOnlyHighlyRecommended ? "Включено" : "Отключено"}
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">
              Приоритет соответствию бюджету
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="budget-fit-filter"
                checked={prioritizeBudgetFit}
                onCheckedChange={onBudgetFitChange}
              />
              <label
                htmlFor="budget-fit-filter"
                className="text-sm text-muted-foreground"
              >
                {prioritizeBudgetFit ? "Включено" : "Отключено"}
              </label>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Применены фильтры
            </Badge>
            <Button variant="ghost" size="sm" onClick={onReset}>
              Сбросить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
