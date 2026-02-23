"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@qbs-autonaim/ui/components/alert-dialog";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
import type { FunnelCandidate, FunnelCandidateDetail } from "../types";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: FunnelCandidate | FunnelCandidateDetail | null;
  workspaceId: string;
}

export function RejectDialog({
  open,
  onOpenChange,
  candidate,
  workspaceId,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const { mutate: rejectCandidate, isPending: isRejecting } = useMutation(
    orpc.candidates.rejectCandidate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.candidates.list.queryKey({
            input: { workspaceId },
          }),
        });
        toast.success("Кандидат отклонён");
        onOpenChange(false);
        setReason("");
      },
      onError: () => {
        toast.error("Не удалось отклонить кандидата");
      },
    }),
  );

  const handleReject = () => {
    if (!candidate) return;
    rejectCandidate({
      candidateId: candidate.id,
      workspaceId,
    });
  };

  if (!candidate) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отклонить кандидата?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите отклонить кандидата{" "}
            <span className="font-semibold">{candidate.name}</span>? Это
            действие можно будет отменить, изменив статус.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label htmlFor="reject-reason" className="text-sm font-medium">
            Причина отклонения (необязательно)
          </label>
          <Textarea
            id="reject-reason"
            placeholder="Укажите причину отклонения…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={isRejecting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRejecting}>Отмена</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Отклонить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
