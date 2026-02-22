"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui/components/table";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Star,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type {
  CandidateStatus,
  GlobalCandidate,
  SortField,
  SortOrder,
} from "../../types/types";
import {
  CANDIDATE_STATUS_COLORS,
  CANDIDATE_STATUS_LABELS,
} from "../../types/types";

interface CandidatesTableProps {
  candidates: GlobalCandidate[];
  onRowClick: (candidate: GlobalCandidate) => void;
  onStatusChange: (candidateId: string, status: CandidateStatus) => void;
  isLoading?: boolean;
  sort: { field: SortField; order: SortOrder };
  onSort: (sort: { field: SortField; order: SortOrder }) => void;
}

interface SortHeaderProps {
  field: SortField;
  label: string;
  currentSort: { field: SortField; order: SortOrder };
  onSort: (field: SortField) => void;
}

function SortHeader({ field, label, currentSort, onSort }: SortHeaderProps) {
  const isActive = currentSort.field === field;

  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentSort.order === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}

function CandidateRow({
  candidate,
  onRowClick,
  onStatusChange,
}: {
  candidate: GlobalCandidate;
  onRowClick: (candidate: GlobalCandidate) => void;
  onStatusChange: (candidateId: string, status: CandidateStatus) => void;
}) {
  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.fullName);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const initials = candidate.fullName
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleStatusChange = useCallback(
    (status: CandidateStatus) => {
      onStatusChange(candidate.id, status);
      setIsMenuOpen(false);
    },
    [candidate.id, onStatusChange],
  );

  const formatSalary = (amount: number | null | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={() => onRowClick(candidate)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(candidate);
        }
      }}
      aria-label={`Открыть профиль ${candidate.fullName}`}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border shrink-0">
            <AvatarImage src={avatarUrl} alt={candidate.fullName} />
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{candidate.fullName}</p>
            {candidate.headline && (
              <p className="text-xs text-muted-foreground truncate">
                {candidate.headline}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className={cn("text-xs", CANDIDATE_STATUS_COLORS[candidate.status])}
        >
          {CANDIDATE_STATUS_LABELS[candidate.status]}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[120px]">
            {candidate.location || "—"}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span>
            {candidate.experienceYears !== null &&
            candidate.experienceYears !== undefined
              ? `${candidate.experienceYears} лет`
              : "—"}
          </span>
        </div>
      </TableCell>

      <TableCell className="font-medium tabular-nums text-sm">
        {formatSalary(candidate.salaryExpectationsAmount)}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {candidate.skills.slice(0, 2).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-xs px-1.5 py-0"
            >
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 2 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              +{candidate.skills.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5 text-sm">
          {candidate.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[150px]">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="tabular-nums">{candidate.phone}</span>
            </div>
          )}
          {candidate.telegramUsername && (
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span>@{candidate.telegramUsername}</span>
            </div>
          )}
          {!candidate.email &&
            !candidate.phone &&
            !candidate.telegramUsername && (
              <span className="text-muted-foreground">—</span>
            )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="tabular-nums">
            {new Date(candidate.lastActivity).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Действия</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onRowClick(candidate)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Открыть профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={candidate.status === "ACTIVE"}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Активен
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("HIRED")}
              disabled={candidate.status === "HIRED"}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Нанят
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("BLACKLISTED")}
              disabled={candidate.status === "BLACKLISTED"}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />В чёрный список
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function CandidatesTable({
  candidates,
  onRowClick,
  onStatusChange,
  isLoading,
  sort,
  onSort,
}: CandidatesTableProps) {
  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sort.field === field && sort.order === "desc" ? "asc" : "desc";
      onSort({ field, order: newOrder });
    },
    [sort, onSort],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Кандидаты не найдены</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Попробуйте изменить параметры поиска или фильтры
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">
                <SortHeader
                  field="fullName"
                  label="Кандидат"
                  currentSort={sort}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[120px]">Статус</TableHead>
              <TableHead className="w-[130px]">Локация</TableHead>
              <TableHead className="w-[100px]">Опыт</TableHead>
              <TableHead className="w-[120px]">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  <span>Зарплата</span>
                </div>
              </TableHead>
              <TableHead className="w-[150px]">Навыки</TableHead>
              <TableHead className="w-[180px]">Контакты</TableHead>
              <TableHead className="w-[120px]">
                <SortHeader
                  field="lastActivity"
                  label="Активность"
                  currentSort={sort}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                onRowClick={onRowClick}
                onStatusChange={onStatusChange}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
