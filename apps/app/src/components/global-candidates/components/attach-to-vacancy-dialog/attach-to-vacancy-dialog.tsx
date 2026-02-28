"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import type { GlobalCandidate } from "../../types/types";

interface AttachToVacancyDialogProps {
  candidate: GlobalCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AttachToVacancyDialog({
  candidate,
  open,
  onOpenChange,
  onSuccess,
}: AttachToVacancyDialogProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspaceId, workspace } = useWorkspaceContext();
  const organizationId = workspace?.organizationId;

  // Загрузка вакансий текущего workspace
  const { data: vacancies, isLoading: isLoadingVacancies } = useQuery(
    workspaceId ? orpc.vacancy.list.queryOptions({ workspaceId }) : skipToken,
  );

  const attachMutation = useMutation(
    orpc.globalCandidates.attachToVacancy.mutationOptions({
      onSuccess: (result) => {
        if (candidate?.id && organizationId) {
          queryClient.invalidateQueries({
            queryKey: orpc.globalCandidates.get.queryKey({
              input: { candidateId: candidate.id, organizationId },
            }),
          });
        }
        queryClient.invalidateQueries({
          queryKey: orpc.globalCandidates.list.queryKey(),
        });
        toast.success(
          `Кандидат прикреплён к вакансии «${result.vacancyTitle}»`,
        );
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось прикрепить кандидата");
      },
    }),
  );

  const handleAttach = (vacancyId: string) => {
    if (!candidate?.id || !workspaceId) return;
    attachMutation.mutate({
      candidateId: candidate.id,
      vacancyId,
      workspaceId,
    });
  };

  const activeVacancies = (vacancies ?? []).filter((v) => v.isActive !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Прикрепить к вакансии</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <>
                Выберите вакансию, к которой прикрепить кандидата{" "}
                <span className="font-medium text-foreground">
                  {candidate.fullName}
                </span>
                . После прикрепления с кандидатом можно работать в карточке
                отклика.
              </>
            ) : (
              "Выберите вакансию для прикрепления кандидата."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoadingVacancies ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeVacancies.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <Briefcase className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Нет активных вакансий в текущем workspace
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Создайте вакансию, чтобы прикрепить к ней кандидата
              </p>
            </div>
          ) : (
            <Select
              onValueChange={handleAttach}
              disabled={attachMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите вакансию" />
              </SelectTrigger>
              <SelectContent>
                {activeVacancies.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.title}
                    {v.region && (
                      <span className="ml-2 text-muted-foreground">
                        ({v.region})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={attachMutation.isPending}
          >
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
