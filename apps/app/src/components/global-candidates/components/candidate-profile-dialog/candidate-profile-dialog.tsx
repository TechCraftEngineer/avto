"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@qbs-autonaim/ui/components/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { cn } from "@qbs-autonaim/ui/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Clock,
  FileText,
  Globe,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Plane,
  Star,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useMediaQuery } from "~/hooks/use-media-query";
import { getAvatarUrl } from "~/lib/avatar";
import { useORPC } from "~/orpc/react";
import type { CandidateStatus, GlobalCandidate } from "../../types/types";
import {
  CANDIDATE_STATUS_COLORS,
  CANDIDATE_STATUS_LABELS,
} from "../../types/types";

interface CandidateProfileDialogProps {
  candidate: GlobalCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (candidateId: string, status: CandidateStatus) => void;
}

function formatSalary(amount: number | null | undefined) {
  if (!amount) return "Не указано";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Не указано";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ProfileContent({
  candidate,
  organizationId,
  onStatusChange,
}: {
  candidate: GlobalCandidate;
  organizationId: string | null | undefined;
  onStatusChange: (candidateId: string, status: CandidateStatus) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Получаем детальную информацию о кандидате
  const { data: candidateDetail, isLoading } = useQuery(
    orpc.globalCandidates.get.queryOptions({
      input: {
        candidateId: candidate.id,
        organizationId: organizationId ?? "",
      },
      enabled: !!candidate.id && !!organizationId,
    }),
  );

  // Мутация для обновления статуса
  const statusMutation = useMutation(
    orpc.globalCandidates.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.globalCandidates.list.queryKey(),
        });
      },
    }),
  );

  // Инициализация заметок
  useEffect(() => {
    if (candidateDetail?.orgNotes) {
      setNotes(candidateDetail.orgNotes);
    }
  }, [candidateDetail?.orgNotes]);

  const handleStatusChange = useCallback(
    (status: CandidateStatus) => {
      if (candidate?.id && organizationId) {
        statusMutation.mutate({
          candidateId: candidate.id,
          organizationId,
          status,
        });
        onStatusChange(candidate.id, status);
      }
    },
    [candidate?.id, organizationId, statusMutation, onStatusChange],
  );

  const handleSaveNotes = useCallback(() => {
    if (candidate?.id && organizationId) {
      statusMutation.mutate({
        candidateId: candidate.id,
        organizationId,
        status: candidateDetail?.orgStatus ?? "ACTIVE",
        notes,
      });
      setIsEditingNotes(false);
    }
  }, [
    candidate?.id,
    organizationId,
    statusMutation,
    candidateDetail?.orgStatus,
    notes,
  ]);

  const handleNotesClick = useCallback(() => {
    setIsEditingNotes(true);
  }, []);

  const handleNotesKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsEditingNotes(true);
    }
  }, []);

  const photoUrl = useAvatarUrl(candidate.avatarFileId);
  const avatarUrl = getAvatarUrl(photoUrl, candidate.fullName);

  const initials = candidate.fullName
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      {/* Заголовок с основной информацией */}
      <div className="flex items-start gap-4 pb-4">
        <Avatar className="h-16 w-16 border shrink-0">
          <AvatarImage src={avatarUrl} alt={candidate.fullName} />
          <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">{candidate.fullName}</h2>
              {candidate.headline && (
                <p className="text-sm text-muted-foreground">
                  {candidate.headline}
                </p>
              )}
            </div>

            {/* Меню действий */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Активен
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("HIRED")}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Нанят
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange("BLACKLISTED")}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />В чёрный список
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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

      <Separator className="my-4" />

      {/* Табы */}
      <Tabs
        defaultValue="info"
        className="flex-1 min-h-0 overflow-hidden flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="responses">Отклики</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
        </TabsList>

        <TabsContent
          value="info"
          className="mt-4 overflow-y-auto min-h-0 flex-1"
        >
          <div className="space-y-4">
            {/* Контакты */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Контакты
              </h4>
              <div className="grid gap-2">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-primary hover:underline"
                    >
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`tel:${candidate.phone}`}
                      className="text-primary hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.telegramUsername && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`https://t.me/${candidate.telegramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @{candidate.telegramUsername}
                    </a>
                  </div>
                )}
                {!candidate.email &&
                  !candidate.phone &&
                  !candidate.telegramUsername && (
                    <p className="text-sm text-muted-foreground">
                      Контакты не указаны
                    </p>
                  )}
              </div>
            </div>

            {/* Основная информация */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Основное
              </h4>
              <div className="grid gap-2">
                {candidate.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{candidate.location}</span>
                  </div>
                )}
                {candidate.experienceYears !== null &&
                  candidate.experienceYears !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{candidate.experienceYears} лет опыта</span>
                    </div>
                  )}
                {candidate.salaryExpectationsAmount && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {formatSalary(candidate.salaryExpectationsAmount)}
                    </span>
                  </div>
                )}
                {candidate.workFormat && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      {candidate.workFormat === "remote"
                        ? "Удалённая работа"
                        : candidate.workFormat === "office"
                          ? "Работа в офисе"
                          : "Гибридный формат"}
                    </span>
                  </div>
                )}
                {candidate.englishLevel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Английский: {candidate.englishLevel}</span>
                  </div>
                )}
                {candidate.readyForRelocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Готов к релокации</span>
                  </div>
                )}
              </div>
            </div>

            {/* Навыки */}
            {candidate.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Навыки
                </h4>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Резюме */}
            {candidate.resumeUrl && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Резюме
                </h4>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Открыть резюме
                  </a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="responses"
          className="mt-4 overflow-y-auto min-h-0 flex-1"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : candidateDetail?.responses &&
            candidateDetail.responses.length > 0 ? (
            <div className="space-y-3">
              {candidateDetail.responses.map((response) => (
                <div
                  key={response.id}
                  className="p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {response.vacancyTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Статус: {response.status}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(response.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Нет откликов</p>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="notes"
          className="mt-4 overflow-y-auto min-h-0 flex-1"
        >
          <div className="space-y-3">
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Добавьте заметки о кандидате…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes}>
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNotes(candidateDetail?.orgNotes ?? "");
                      setIsEditingNotes(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="w-full min-h-[100px] p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors text-left"
                onClick={handleNotesClick}
                onKeyDown={handleNotesKeyDown}
              >
                {candidateDetail?.orgNotes ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {candidateDetail.orgNotes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нажмите, чтобы добавить заметки…
                  </p>
                )}
              </button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CandidateProfileDialog({
  candidate,
  open,
  onOpenChange,
  onStatusChange,
}: CandidateProfileDialogProps) {
  const { workspace } = useWorkspaceContext();
  const organizationId = workspace?.organizationId;
  const isDesktop = useMediaQuery("(min-width: 768px)"); // Должен вызываться до early return

  if (!candidate) return null;

  // Рендерим только один компонент — иначе два overlay (Dialog + Sheet) складываются и затемняют экран вдвойне
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Профиль кандидата {candidate.fullName}</DialogTitle>
          </DialogHeader>
          <ProfileContent
            candidate={candidate}
            organizationId={organizationId}
            onStatusChange={onStatusChange}
            onOpenChange={onOpenChange}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Профиль кандидата {candidate.fullName}</SheetTitle>
        </SheetHeader>
        <ProfileContent
          candidate={candidate}
          organizationId={organizationId}
          onStatusChange={onStatusChange}
          onOpenChange={onOpenChange}
        />
      </SheetContent>
    </Sheet>
  );
}
