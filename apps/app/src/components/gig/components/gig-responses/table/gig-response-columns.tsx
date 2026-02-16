"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { HR_SELECTION_STATUS_LABELS } from "@qbs-autonaim/db/schema";
import type { VacancyHrSelectionStatus } from "@qbs-autonaim/db/schema";
import { Badge, InfoTooltip } from "@qbs-autonaim/ui";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ScreeningHoverCard } from "~/components/vacancy/components/screening/screening-hover-card";
import { CoverLetterCell } from "~/components/vacancy/components/responses/response-row/cover-letter-cell";
import { RESPONSE_STATUS_CONFIG } from "~/lib/shared/response-configs";
import { GigCandidateCell } from "./gig-candidate-cell";
import { GigResponseActions } from "./gig-response-actions";
import { GigColumnHeader, type GigTableMeta } from "./gig-column-header";

export type GigResponseListItem = RouterOutputs["gig"]["responses"]["list"]["items"][number];

export type { GigTableMeta };

function mapScreeningForHoverCard(
  screening: GigResponseListItem["screening"],
): { score: number; detailedScore: number; analysis: string | null } | null {
  if (!screening) return null;
  const score = screening.overallScore ?? 0;
  return {
    score,
    detailedScore: score,
    analysis: screening.overallAnalysis ?? null,
  };
}

function mapInterviewForHoverCard(
  scoring: GigResponseListItem["interviewScoring"],
): { score: number; detailedScore: number; analysis: string | null } | null {
  if (!scoring) return null;
  const detailedScore = scoring.rating != null
    ? scoring.rating * 20
    : scoring.score;
  return {
    score: scoring.score,
    detailedScore,
    analysis: scoring.analysis ?? null,
  };
}

const columnHelper = createColumnHelper<GigResponseListItem>();

export function createGigResponseColumns() {
  return [
    columnHelper.display({
      id: "candidate",
      header: () => "Кандидат",
      size: 280,
      cell: ({ row, table }) => {
        const m = table.options.meta as GigTableMeta & {
          orgSlug: string;
          workspaceSlug: string;
          gigId: string;
        };
        return (
          <GigCandidateCell
            response={row.original}
            orgSlug={m.orgSlug}
            workspaceSlug={m.workspaceSlug}
            gigId={m.gigId}
          />
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: (ctx) => {
        const meta = (ctx.table.options.meta ?? {}) as GigTableMeta;
        return (
          <GigColumnHeader
            context={ctx}
            label="Статус"
            sortField="status"
            meta={meta}
          />
        );
      },
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
            {Object.hasOwn(RESPONSE_STATUS_CONFIG, r.status)
              ? RESPONSE_STATUS_CONFIG[r.status as keyof typeof RESPONSE_STATUS_CONFIG]
                  .label
              : r.status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "price",
      header: (ctx) => {
        const meta = (ctx.table.options.meta ?? {}) as GigTableMeta;
        return (
          <GigColumnHeader
            context={ctx}
            label={
              <div className="flex items-center gap-1.5">
                Цена
                <InfoTooltip content="Предложенная кандидатом стоимость выполнения задания" />
              </div>
            }
            sortField="proposedPrice"
            meta={meta}
          />
        );
      },
      cell: ({ row }) =>
        row.original.proposedPrice != null ? (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat("ru-RU").format(row.original.proposedPrice)}{" "}
            ₽
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    }),
    columnHelper.display({
      id: "delivery",
      header: (ctx) => {
        const meta = (ctx.table.options.meta ?? {}) as GigTableMeta;
        return (
          <GigColumnHeader
            context={ctx}
            label={
              <div className="flex items-center gap-1.5">
                Срок
                <InfoTooltip content="Срок выполнения в днях, предложенный кандидатом" />
              </div>
            }
            sortField="proposedDeliveryDays"
            meta={meta}
          />
        );
      },
      cell: ({ row }) =>
        row.original.proposedDeliveryDays != null ? (
          <span className="text-sm font-medium">
            {row.original.proposedDeliveryDays}{" "}
            {row.original.proposedDeliveryDays === 1
              ? "день"
              : row.original.proposedDeliveryDays < 5
                ? "дня"
                : "дней"}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    }),
    columnHelper.display({
      id: "screening",
      header: () => (
        <div className="flex items-center gap-1.5">
          Скрининг
          <InfoTooltip content="Оценка соответствия кандидата требованиям задания на основе AI-анализа" />
        </div>
      ),
      cell: ({ row }) => {
        const mapped = mapScreeningForHoverCard(row.original.screening);
        return mapped ? (
          <ScreeningHoverCard screening={mapped} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    }),
    columnHelper.display({
      id: "interview",
      header: () => (
        <div className="flex items-center gap-1.5">
          Интервью
          <InfoTooltip content="Оценка после прохождения интервью с кандидатом" />
        </div>
      ),
      cell: ({ row }) => {
        const mapped = mapInterviewForHoverCard(row.original.interviewScoring);
        return mapped ? (
          <ScreeningHoverCard screening={mapped} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    }),
    columnHelper.display({
      id: "hrSelection",
      header: () => (
        <div className="flex items-center gap-1.5">
          HR статус
          <InfoTooltip content="Решение по кандидату" />
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
          <InfoTooltip content="Текст отклика кандидата на задание" />
        </div>
      ),
      cell: ({ row }) => (
        <CoverLetterCell coverLetter={row.original.coverLetter} />
      ),
    }),
    columnHelper.display({
      id: "date",
      header: (ctx) => {
        const meta = (ctx.table.options.meta ?? {}) as GigTableMeta;
        return (
          <GigColumnHeader
            context={ctx}
            label={
              <div className="flex items-center gap-1.5">
                Дата
                <InfoTooltip content="Дата и время отклика кандидата" />
              </div>
            }
            sortField="createdAt"
            meta={meta}
          />
        );
      },
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {row.original.createdAt
            ? new Date(row.original.createdAt)
                .toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(" г.", "")
            : "—"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      enableColumnOrdering: false,
      header: () => (
        <span className="font-semibold text-foreground">Действия</span>
      ),
      cell: ({ row, table }) => {
        const r = row.original;
        const m = table.options.meta as GigTableMeta & {
          orgSlug: string;
          workspaceSlug: string;
          gigId: string;
          onAccept: (id: string) => void;
          onReject: (id: string) => void;
          onMessage: (id: string) => void;
          isProcessing: boolean;
        };
        return (
          <div className="flex justify-end gap-2 px-1">
            <GigResponseActions
              responseId={r.id}
              candidateName={r.candidateName}
              telegramUsername={r.telegramUsername}
              phone={r.phone}
              email={r.email}
              onAccept={m.onAccept}
              onReject={m.onReject}
              onMessage={m.onMessage}
              isProcessing={m.isProcessing}
            />
          </div>
        );
      },
      size: 48,
    }),
  ] as ColumnDef<GigResponseListItem, unknown>[];
}
