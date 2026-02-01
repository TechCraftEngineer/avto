"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Star,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type { FunnelCandidate, FunnelStage } from "./types";
import { STAGE_COLORS, STAGE_LABELS } from "./types";

function CandidateRow({
  candidate,
  onRowClick,
}: {
  candidate: FunnelCandidate;
  onRowClick: (candidate: FunnelCandidate) => void;
}) {
  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.name);

  const getStageText = (stage: string) =>
    STAGE_LABELS[stage as FunnelStage] ?? stage;
  const getStageColor = (stage: string) =>
    STAGE_COLORS[stage as FunnelStage] ?? "";

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onRowClick(candidate)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(candidate);
        }
      }}
      aria-label={`Открыть профиль ${candidate.name}`}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={avatarUrl} alt={candidate.name} />
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {candidate.initials}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium truncate">{candidate.name}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{candidate.vacancyName}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Star
            className={cn(
              "h-4 w-4",
              candidate.matchScore >= 70
                ? "fill-amber-400 text-amber-400"
                : candidate.matchScore >= 40
                  ? "fill-amber-300 text-amber-300"
                  : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "font-semibold tabular-nums",
              candidate.matchScore >= 70
                ? "text-emerald-600 dark:text-emerald-400"
                : candidate.matchScore >= 40
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
            )}
          >
            {candidate.matchScore}%
          </span>
        </div>
      </TableCell>
      <TableCell className="font-medium tabular-nums text-sm">
        {candidate.salaryExpectation}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {new Date(candidate.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("text-xs", getStageColor(candidate.stage))}
        >
          {getStageText(candidate.stage)}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

type SortField =
  | "name"
  | "position"
  | "matchScore"
  | "salaryExpectation"
  | "createdAt"
  | "stage";
type SortDirection = "asc" | "desc";

interface CandidatesTableProps {
  candidates: FunnelCandidate[];
  onRowClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
}

export function CandidatesTable({
  candidates,
  onRowClick,
  isLoading,
}: CandidatesTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, "ru");
          break;
        case "position":
          comparison = a.position.localeCompare(b.position, "ru");
          break;
        case "matchScore":
          comparison = a.matchScore - b.matchScore;
          break;
        case "salaryExpectation": {
          const aValue = Number(a.salaryExpectation) || 0;
          const bValue = Number(b.salaryExpectation) || 0;
          comparison = aValue - bValue;
          break;
        }
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "stage": {
          const stageOrder = [
            "NEW",
            "REVIEW",
            "INTERVIEW",
            "HIRED",
            "REJECTED",
          ];
          comparison =
            stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [candidates, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={cn(
          "flex items-center gap-1.5 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded",
          sortField === field ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label={`Сортировать по ${children}`}
      >
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Кандидат</TableHead>
              <TableHead>Вакансия</TableHead>
              <TableHead className="w-[100px]">Совпадение</TableHead>
              <TableHead>Зарплата</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[140px]">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                </TableCell>

                <TableCell>
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-muted/10">
        <Users className="h-12 w-12 mb-4 opacity-40" aria-hidden="true" />
        <p className="text-lg font-medium">Нет кандидатов</p>
        <p className="text-sm mt-1">
          Кандидаты появятся здесь после отклика на вакансии
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="name" className="w-[280px]">
              Кандидат
            </SortableHeader>
            <SortableHeader field="position">Вакансия</SortableHeader>
            <SortableHeader field="matchScore" className="w-[100px]">
              Совпадение
            </SortableHeader>
            <SortableHeader field="salaryExpectation">Зарплата</SortableHeader>
            <SortableHeader field="createdAt">Дата</SortableHeader>
            <SortableHeader field="stage" className="w-[140px]">
              Статус
            </SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCandidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              onRowClick={onRowClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
