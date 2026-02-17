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
import { CheckCircle2 } from "lucide-react";

interface HHIntegrationSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HHIntegrationSuccessDialog({
  open,
  onClose,
}: HHIntegrationSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" aria-hidden />
          </div>
          <DialogTitle className="text-2xl font-semibold">
            Интеграция с hh.ru подключена
          </DialogTitle>
          <DialogDescription className="text-base">
            Ваш аккаунт hh.ru успешно подключён. Теперь вы можете импортировать
            вакансии и управлять откликами.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="h-11 w-full sm:w-auto">
            Отлично
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
