"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "accept" | "reject";
  candidateName?: string | null;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  action,
  candidateName,
  onConfirm,
  isProcessing,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {action === "accept" ? "Принять отклик?" : "Отклонить отклик?"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {candidateName && (
              <span className="font-medium break-words">{candidateName}</span>
            )}
            {action === "accept"
              ? " — вы уверены, что хотите принять этот отклик? Кандидат будет уведомлен."
              : " — вы уверены, что хотите отклонить этот отклик? Это действие нельзя отменить."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto min-h-11 sm:min-h-9 touch-manipulation"
          >
            Отмена
          </Button>
          <Button
            variant={action === "accept" ? "default" : "destructive"}
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto min-h-11 sm:min-h-9 touch-manipulation"
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {action === "accept" ? "Принять" : "Отклонить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
