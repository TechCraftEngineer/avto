"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Card, CardContent } from "@qbs-autonaim/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import { cn } from "@qbs-autonaim/ui/utils";
import {
  Briefcase,
  Calendar,
  MapPin,
  MoreVertical,
  Star,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { getAvatarUrl } from "~/lib/avatar";
import type { CandidateStatus, GlobalCandidate } from "../../types/types";
import {
  CANDIDATE_STATUS_COLORS,
  CANDIDATE_STATUS_LABELS,
} from "../../types/types";

interface CandidateCardProps {
  candidate: GlobalCandidate;
  onViewProfile: (candidate: GlobalCandidate) => void;
  onStatusChange: (candidateId: string, status: CandidateStatus) => void;
}

export function CandidateCard({
  candidate,
  onViewProfile,
  onStatusChange,
}: CandidateCardProps) {
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

  const handleViewProfile = useCallback(() => {
    onViewProfile(candidate);
  }, [candidate, onViewProfile]);

  const formatSalary = (amount: number | null | undefined) => {
    if (!amount) return null;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Аватар и основная информация */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 border shrink-0">
              <AvatarImage src={avatarUrl} alt={candidate.fullName} />
              <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{candidate.fullName}</h3>
              </div>

              {candidate.headline && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {candidate.headline}
                </p>
              )}

              {/* Статус */}
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    CANDIDATE_STATUS_COLORS[candidate.status],
                  )}
                >
                  {CANDIDATE_STATUS_LABELS[candidate.status]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Меню действий */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Действия</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleViewProfile}>
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
        </div>

        {/* Контакты */}
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {candidate.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[120px]">
                {candidate.location}
              </span>
            </div>
          )}
          {candidate.experienceYears !== null &&
            candidate.experienceYears !== undefined && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span>{candidate.experienceYears} лет опыта</span>
              </div>
            )}
        </div>

        {/* Зарплатные ожидания */}
        {candidate.salaryExpectationsAmount && (
          <div className="mt-2 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-medium tabular-nums">
              {formatSalary(candidate.salaryExpectationsAmount)}
            </span>
          </div>
        )}

        {/* Навыки */}
        {candidate.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="text-xs px-2 py-0.5"
              >
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{candidate.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Связанные вакансии */}
        {candidate.relatedVacancies.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Отклики:</p>
            <div className="flex flex-wrap gap-1">
              {candidate.relatedVacancies.slice(0, 2).map((vacancy) => (
                <Badge
                  key={vacancy}
                  variant="outline"
                  className="text-xs px-2 py-0.5 truncate max-w-[150px]"
                >
                  {vacancy}
                </Badge>
              ))}
              {candidate.relatedVacancies.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{candidate.relatedVacancies.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Последняя активность */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Активность:{" "}
              {new Date(candidate.lastActivity).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
