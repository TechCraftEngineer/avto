import { Checkbox } from "@qbs-autonaim/ui";
import { InfoTooltip } from "@qbs-autonaim/ui";
import { TableHead, TableHeader, TableRow } from "@qbs-autonaim/ui";
import { memo } from "react";
import type { ColumnId, SortDirection, SortField } from "../types";
import { SortableHeaderCell } from "./sortable-header-cell";
import { StaticHeaderCell } from "./static-header-cell";

interface ResponseTableHeaderProps {
  readonly allSelected: boolean;
  readonly onSelectAll: () => void;
  readonly hasResponses: boolean;
  readonly sortField: SortField;
  readonly sortDirection: SortDirection;
  readonly onSort: (field: SortField) => void;
  readonly isColumnVisible: (columnId: ColumnId) => boolean;
}

function ResponseTableHeaderComponent({
  allSelected,
  onSelectAll,
  hasResponses,
  sortField,
  sortDirection,
  onSort,
  isColumnVisible,
}: ResponseTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead className="w-10 pl-4">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            disabled={!hasResponses}
            aria-label={
              allSelected
                ? "Снять выделение со всех откликов"
                : "Выбрать все отклики"
            }
          />
        </TableHead>

        {isColumnVisible("candidate") && <StaticHeaderCell label="Кандидат" />}

        {isColumnVisible("status") && (
          <SortableHeaderCell
            field="status"
            label="Статус"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
          />
        )}

        {isColumnVisible("priority") && (
          <SortableHeaderCell
            field="priorityScore"
            label="Приоритет"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Приоритет обработки отклика (0-100). Учитывает соответствие требованиям (40%), свежесть отклика (20%), наличие скрининга (20%) и статус обработки (20%). Высокий приоритет означает, что отклик требует первоочередного внимания." />
            }
          />
        )}

        {isColumnVisible("screening") && (
          <SortableHeaderCell
            field="detailedScore"
            label="Скрининг"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Детальная оценка соответствия кандидата требованиям вакансии на основе автоматического скрининга резюме. Анализируются опыт, навыки, образование и другие критерии." />
            }
          />
        )}

        {isColumnVisible("potential") && (
          <SortableHeaderCell
            field="potentialScore"
            label="Потенциал"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Оценка потенциала роста и развития кандидата. Учитывается динамика карьеры, скорость освоения новых навыков, амбициозность целей и способность к обучению." />
            }
          />
        )}

        {isColumnVisible("career") && (
          <SortableHeaderCell
            field="careerTrajectoryScore"
            label="Карьера"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Оценка карьерной траектории кандидата. Анализируется последовательность позиций, рост ответственности, смена компаний и достижения на каждом этапе карьеры." />
            }
          />
        )}

        {isColumnVisible("risks") && (
          <StaticHeaderCell
            label="Риски"
            tooltip={
              <InfoTooltip content="Потенциальные риски при найме кандидата: частая смена работы, длительные перерывы в карьере, несоответствие ожиданий по зарплате, отсутствие ключевых навыков." />
            }
          />
        )}

        {isColumnVisible("salary") && (
          <SortableHeaderCell
            field="salaryExpectationsAmount"
            label="Зарплата"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Зарплатные ожидания кандидата. Сравните с бюджетом вакансии, чтобы оценить соответствие финансовых ожиданий." />
            }
          />
        )}

        {isColumnVisible("skills") && (
          <StaticHeaderCell
            label="Навыки"
            tooltip={
              <InfoTooltip content="Ключевые профессиональные навыки кандидата, релевантные для данной вакансии. Показывает степень владения требуемыми технологиями и инструментами." />
            }
          />
        )}

        {isColumnVisible("interview") && (
          <StaticHeaderCell
            label="Интервью"
            tooltip={
              <InfoTooltip content="Статус и результаты проведенных интервью с кандидатом. Показывает этап собеседования и оценки интервьюеров." />
            }
          />
        )}

        {isColumnVisible("hrSelection") && (
          <StaticHeaderCell
            label="Отбор HR"
            tooltip={
              <InfoTooltip content="Решение HR-специалиста по кандидату: рекомендован к интервью, приглашен, отклонен или требует дополнительной проверки." />
            }
          />
        )}

        {isColumnVisible("coverLetter") && (
          <StaticHeaderCell
            label="Отклик"
            tooltip={
              <InfoTooltip content="Статус обработки отклика: новый, просмотрен, в работе, отклонен. Помогает отслеживать прогресс работы с кандидатом." />
            }
          />
        )}

        {isColumnVisible("date") && (
          <SortableHeaderCell
            field="respondedAt"
            label="Дата"
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSort={onSort}
            tooltip={
              <InfoTooltip content="Дата и время, когда кандидат откликнулся на вакансию. Свежие отклики имеют более высокий приоритет." />
            }
          />
        )}

        <TableHead className="text-right pr-4 font-semibold text-foreground">
          Действия
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export const ResponseTableHeader = memo(ResponseTableHeaderComponent);
