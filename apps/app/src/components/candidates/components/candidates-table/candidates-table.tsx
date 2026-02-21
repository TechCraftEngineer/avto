"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  Briefcase,
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type { SortDirection } from "@qbs-autonaim/shared";
import type { FunnelCandidate } from "../../types/types";
import type { ColumnVisibility } from "./column-visibility-toggle";

function CandidateRow({
  candidate,
  onRowClick,
  visibility,
}: {
  candidate: FunnelCandidate;
  onRowClick: (candidate: FunnelCandidate) => void;
  visibility: ColumnVisibility;
}) {
  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.name);

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

      {visibility.vacancy && (
        <TableCell>
          <span className="text-sm">{candidate.vacancyName}</span>
        </TableCell>
      )}

      {visibility.experience && (
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{candidate.experience}</span>
          </div>
        </TableCell>
      )}

      {visibility.location && (
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{candidate.location}</span>
          </div>
        </TableCell>
      )}

      {visibility.matchScore && (
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
      )}

      {visibility.salary && (
        <TableCell className="font-medium tabular-nums text-sm">
          {candidate.salaryExpectation}
        </TableCell>
      )}

      {visibility.email && (
        <TableCell>
          {candidate.email ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Mail
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate max-w-[200px]">{candidate.email}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {visibility.phone && (
        <TableCell>
          {candidate.phone ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="tabular-nums">{candidate.phone}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {visibility.telegram && (
        <TableCell>
          {candidate.telegram ? (
            <div className="flex items-center gap-1.5 text-sm">
              <MessageCircle
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>@{candidate.telegram}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {visibility.createdAt && (
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
      )}
    </TableRow>
  );
}

type SortField =
  | "name"
  | "vacancy"
  | "experience"
  | "location"
  | "matchScore"
  | "salaryExpectation"
  | "createdAt";

interface CandidatesTableProps {
  candidates: FunnelCandidate[];
  onRowClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
  visibility: ColumnVisibility;
}

export function CandidatesTable({
  candidates,
  onRowClick,
  isLoading,
  visibility,
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
        case "vacancy":
          comparison = a.vacancyName.localeCompare(b.vacancyName, "ru");
          break;
        case "experience":
          comparison = a.experience.localeCompare(b.experience, "ru");
          break;
        case "location":
          comparison = a.location.localeCompare(b.location, "ru");
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
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [candidates, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d: SortDirection) => (d === "asc" ? "desc" : "asc"));
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
              {visibility.vacancy && <TableHead>Вакансия</TableHead>}
              {visibility.experience && <TableHead>Опыт</TableHead>}
              {visibility.location && <TableHead>Локация</TableHead>}
              {visibility.matchScore && (
                <TableHead className="w-[100px]">Совпадение</TableHead>
              )}
              {visibility.salary && <TableHead>Зарплата</TableHead>}
              {visibility.email && <TableHead>Электронная почта</TableHead>}
              {visibility.phone && <TableHead>Телефон</TableHead>}
              {visibility.telegram && <TableHead>Telegram</TableHead>}
              {visibility.createdAt && <TableHead>Дата отклика</TableHead>}
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
                {visibility.vacancy && (
                  <TableCell>
                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.experience && (
                  <TableCell>
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.location && (
                  <TableCell>
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.matchScore && (
                  <TableCell>
                    <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.salary && (
                  <TableCell>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.email && (
                  <TableCell>
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.phone && (
                  <TableCell>
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.telegram && (
                  <TableCell>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
                {visibility.createdAt && (
                  <TableCell>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </TableCell>
                )}
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
            {visibility.vacancy && (
              <SortableHeader field="vacancy">Вакансия</SortableHeader>
            )}
            {visibility.experience && (
              <SortableHeader field="experience">Опыт</SortableHeader>
            )}
            {visibility.location && (
              <SortableHeader field="location">Локация</SortableHeader>
            )}
            {visibility.matchScore && (
              <SortableHeader field="matchScore" className="w-[100px]">
                Совпадение
              </SortableHeader>
            )}
            {visibility.salary && (
              <SortableHeader field="salaryExpectation">
                Зарплата
              </SortableHeader>
            )}
            {visibility.email && <TableHead>Электронная почта</TableHead>}
            {visibility.phone && <TableHead>Телефон</TableHead>}
            {visibility.telegram && <TableHead>Telegram</TableHead>}
            {visibility.createdAt && (
              <SortableHeader field="createdAt">Дата отклика</SortableHeader>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCandidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              onRowClick={onRowClick}
              visibility={visibility}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
