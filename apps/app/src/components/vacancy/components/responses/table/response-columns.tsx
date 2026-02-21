"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import type {
  VacancyHrSelectionStatus,
  VacancyResponseStatus,
} from "@qbs-autonaim/db/schema";
import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import { InfoTooltip } from "@qbs-autonaim/ui/components/info-tooltip";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ResponseActions } from "~/components";
import { ScreeningHoverCard } from "../../screening/screening-hover-card";
import { CoverLetterCell } from "../response-row/cover-letter-cell";
import { ScoreCell } from "../response-row/score-cell";
import type { SortField } from "../types";
import { CandidateCell } from "./candidate-cell";
import { ResponseColumnHeader } from "./response-column-header";
import type { ResponseListItem, ResponseTableMeta } from "./types";

const columnHelper = createColumnHelper<ResponseListItem>();

function createColumns(): ColumnDef<ResponseListItem, unknown>[] {
  return [
    columnHelper.display({
      id: "select",
      enableColumnOrdering: false,
      enableHiding: false,
      header: ({ table }) => {
        const meta = table.options.meta as ResponseTableMeta;
        const allSelected =
          meta.selectedIds.size > 0 &&
          table
            .getRowModel()
            .rows.every((r) => meta.selectedIds.has(r.original.id));
        const hasRows = table.getRowModel().rows.length > 0;
        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => meta.onSelectAll(!allSelected)}
            disabled={!hasRows}
            aria-label={
              allSelected
                ? "Снять выделение со всех откликов"
                : "Выбрать все отклики"
            }
          />
        );
      },
      cell: ({ row, table }) => {
        const meta = table.options.meta as ResponseTableMeta;
        return (
          <Checkbox
            checked={meta.selectedIds.has(row.original.id)}
            onCheckedChange={() => meta.onSelect(row.original.id)}
            aria-label={`Выбрать отклик ${row.original.candidateName}`}
          />
        );
      },
      size: 40,
    }),
    columnHelper.display({
      id: "candidate",
      header: () => "Кандидат",
      size: 340,
      minSize: 200,
      meta: { cellClassName: "overflow-hidden" },
      cell: ({ row, table }) => {
        const meta = table.options.meta as ResponseTableMeta;
        return (
          <CandidateCell
            response={row.original}
            orgSlug={meta.orgSlug}
            workspaceSlug={meta.workspaceSlug}
            vacancyId={meta.vacancyId}
          />
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: () => "Статус",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <Badge
            variant={
              r.status === "NEW"
                ? "secondary"
                : r.status === "SKIPPED"
                  ? "destructive"
                  : "outline"
            }
            className="whitespace-nowrap rounded-md font-normal"
          >
            {Object.hasOwn(RESPONSE_STATUS_LABELS, r.status)
              ? RESPONSE_STATUS_LABELS[r.status as VacancyResponseStatus]
              : r.status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "priority",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Приоритет
              <InfoTooltip content="Приоритет обработки отклика (0-100). Учитывает соответствие требованиям (40%), свежесть отклика (20%), наличие скрининга (20%) и статус обработки (20%)." />
            </div>
          }
        />
      ),
      cell: ({ row }) => <ScoreCell score={row.original.priorityScore} />,
      enableSorting: true,
      meta: { sortField: "priorityScore" as SortField },
    }),
    columnHelper.display({
      id: "screening",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Скрининг
              <InfoTooltip content="Детальная оценка соответствия кандидата требованиям вакансии на основе автоматического скрининга." />
            </div>
          }
        />
      ),
      cell: ({ row }) =>
        row.original.screening ? (
          <ScreeningHoverCard screening={row.original.screening} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      enableSorting: true,
      meta: { sortField: "detailedScore" as SortField },
    }),
    columnHelper.display({
      id: "potential",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Потенциал
              <InfoTooltip content="Оценка потенциала роста и развития кандидата." />
            </div>
          }
        />
      ),
      cell: ({ row }) => (
        <ScoreCell score={row.original.screening?.potentialScore} />
      ),
      enableSorting: true,
      meta: { sortField: "potentialScore" as SortField },
    }),
    columnHelper.display({
      id: "career",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Карьера
              <InfoTooltip content="Оценка карьерной траектории кандидата." />
            </div>
          }
        />
      ),
      cell: ({ row }) => (
        <ScoreCell score={row.original.screening?.careerTrajectoryScore} />
      ),
      enableSorting: true,
      meta: { sortField: "careerTrajectoryScore" as SortField },
    }),
    columnHelper.display({
      id: "risks",
      header: () => (
        <div className="flex items-center gap-1.5">
          Риски
          <InfoTooltip content="Потенциальные риски при найме кандидата." />
        </div>
      ),
      cell: () => <span className="text-muted-foreground text-xs">—</span>,
    }),
    columnHelper.display({
      id: "salary",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Зарплата
              <InfoTooltip content="Зарплатные ожидания кандидата." />
            </div>
          }
        />
      ),
      cell: ({ row }) =>
        row.original.salaryExpectationsAmount ? (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat("ru-RU").format(
              row.original.salaryExpectationsAmount,
            )}{" "}
            ₽
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      enableSorting: true,
      meta: { sortField: "salaryExpectationsAmount" as SortField },
    }),
    columnHelper.display({
      id: "skills",
      header: () => (
        <div className="flex items-center gap-1.5">
          Навыки
          <InfoTooltip content="Ключевые профессиональные навыки кандидата." />
        </div>
      ),
      cell: () => <span className="text-muted-foreground text-xs">—</span>,
    }),
    columnHelper.display({
      id: "interview",
      header: () => (
        <div className="flex items-center gap-1.5">
          Интервью
          <InfoTooltip content="Статус и результаты проведенных интервью." />
        </div>
      ),
      cell: ({ row }) =>
        row.original.interviewScoring ? (
          <ScreeningHoverCard screening={row.original.interviewScoring} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    }),
    columnHelper.display({
      id: "hrSelection",
      header: () => (
        <div className="flex items-center gap-1.5">
          Отбор HR
          <InfoTooltip content="Решение HR-специалиста по кандидату." />
        </div>
      ),
      cell: ({ row }) =>
        row.original.hrSelectionStatus ? (
          <Badge variant="outline" className="whitespace-nowrap font-normal">
            {Object.hasOwn(
              HR_SELECTION_STATUS_LABELS,
              row.original.hrSelectionStatus,
            )
              ? HR_SELECTION_STATUS_LABELS[
                  row.original.hrSelectionStatus as VacancyHrSelectionStatus
                ]
              : row.original.hrSelectionStatus}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    }),
    columnHelper.display({
      id: "coverLetter",
      header: () => (
        <div className="flex items-center gap-1.5">
          Отклик
          <InfoTooltip content="Статус обработки отклика." />
        </div>
      ),
      cell: ({ row }) => (
        <CoverLetterCell coverLetter={row.original.coverLetter} />
      ),
    }),
    columnHelper.display({
      id: "date",
      header: (ctx) => (
        <ResponseColumnHeader
          context={ctx}
          label={
            <div className="flex items-center gap-1.5">
              Дата
              <InfoTooltip content="Дата и время, когда кандидат откликнулся на вакансию." />
            </div>
          }
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {row.original.respondedAt
            ? new Date(row.original.respondedAt)
                .toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(" г.", "")
            : "—"}
        </span>
      ),
      enableSorting: true,
      meta: { sortField: "respondedAt" as SortField },
    }),
    columnHelper.display({
      id: "actions",
      enableColumnOrdering: false,
      enableHiding: false,
      header: () => (
        <span className="font-semibold text-foreground">Действия</span>
      ),
      cell: ({ row, table }) => {
        const r = row.original;
        const meta = table.options.meta as ResponseTableMeta;
        return (
          <div className="flex justify-end gap-2 px-1 group/actions">
            <div className="opacity-0 group-hover/actions:opacity-100 transition-opacity">
              <ResponseActions
                responseId={r.id}
                workspaceId={meta.workspaceId}
                vacancyId={meta.vacancyId}
                resumeUrl={r.profileUrl}
                telegramUsername={r.telegramUsername}
                phone={r.phone}
                email={r.email}
                welcomeSentAt={r.welcomeSentAt}
                importSource={r.importSource}
                status={r.status}
                hrSelectionStatus={r.hrSelectionStatus}
                hasScreening={!!r.screening}
                candidateName={r.candidateName}
              />
            </div>
          </div>
        );
      },
      size: 100,
    }),
  ];
}

export const responseColumns = createColumns();
export type { ResponseListItem, ResponseTableMeta } from "./types";
