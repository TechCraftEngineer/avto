import { Checkbox } from "@qbs-autonaim/ui/checkbox";
import { InfoTooltip } from "@qbs-autonaim/ui/info-tooltip";
import { TableHead, TableHeader, TableRow } from "@qbs-autonaim/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection, SortField } from "./types";

interface ResponseTableHeaderProps {
  allSelected: boolean;
  onSelectAll: () => void;
  hasResponses: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ResponseTableHeader({
  allSelected,
  onSelectAll,
  hasResponses,
  sortField,
  sortDirection,
  onSort,
}: ResponseTableHeaderProps) {
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead className="w-10 pl-4">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            disabled={!hasResponses}
          />
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          Кандидат
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onSort("status")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Статус
            {renderSortIcon("status")}
          </button>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("priorityScore")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Приоритет
              {renderSortIcon("priorityScore")}
            </button>
            <InfoTooltip content="Приоритет обработки отклика (0-100). Учитывает соответствие требованиям (40%), свежесть отклика (20%), наличие скрининга (20%) и статус обработки (20%). Высокий приоритет означает, что отклик требует первоочередного внимания." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("detailedScore")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Скрининг
              {renderSortIcon("detailedScore")}
            </button>
            <InfoTooltip content="Детальная оценка соответствия кандидата требованиям вакансии на основе автоматического скрининга резюме. Анализируются опыт, навыки, образование и другие критерии." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("potentialScore")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Потенциал
              {renderSortIcon("potentialScore")}
            </button>
            <InfoTooltip content="Оценка потенциала роста и развития кандидата. Учитывается динамика карьеры, скорость освоения новых навыков, амбициозность целей и способность к обучению." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("careerTrajectoryScore")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Карьера
              {renderSortIcon("careerTrajectoryScore")}
            </button>
            <InfoTooltip content="Оценка карьерной траектории кандидата. Анализируется последовательность позиций, рост ответственности, смена компаний и достижения на каждом этапе карьеры." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <span>Риски</span>
            <InfoTooltip content="Потенциальные риски при найме кандидата: частая смена работы, длительные перерывы в карьере, несоответствие ожиданий по зарплате, отсутствие ключевых навыков." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("salaryExpectationsAmount")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Зарплата
              {renderSortIcon("salaryExpectationsAmount")}
            </button>
            <InfoTooltip content="Зарплатные ожидания кандидата. Сравните с бюджетом вакансии, чтобы оценить соответствие финансовых ожиданий." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <span>Навыки</span>
            <InfoTooltip content="Ключевые профессиональные навыки кандидата, релевантные для данной вакансии. Показывает степень владения требуемыми технологиями и инструментами." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("compositeScore")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Оценка
              {renderSortIcon("compositeScore")}
            </button>
            <InfoTooltip content="Общая комплексная оценка кандидата. Объединяет результаты скрининга, потенциал, карьерную траекторию и другие факторы в единую метрику для удобного сравнения кандидатов." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <span>Интервью</span>
            <InfoTooltip content="Статус и результаты проведенных интервью с кандидатом. Показывает этап собеседования и оценки интервьюеров." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <span>Отбор HR</span>
            <InfoTooltip content="Решение HR-специалиста по кандидату: рекомендован к интервью, приглашен, отклонен или требует дополнительной проверки." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <span>Отклик</span>
            <InfoTooltip content="Статус обработки отклика: новый, просмотрен, в работе, отклонен. Помогает отслеживать прогресс работы с кандидатом." />
          </div>
        </TableHead>
        <TableHead className="font-semibold text-foreground whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSort("respondedAt")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Дата
              {renderSortIcon("respondedAt")}
            </button>
            <InfoTooltip content="Дата и время, когда кандидат откликнулся на вакансию. Свежие отклики имеют более высокий приоритет." />
          </div>
        </TableHead>
        <TableHead className="text-right pr-4 font-semibold text-foreground">
          Действия
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
