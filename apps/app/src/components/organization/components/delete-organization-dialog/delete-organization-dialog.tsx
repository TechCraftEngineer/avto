"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@qbs-autonaim/ui";
import { AlertTriangle } from "lucide-react";
import * as React from "react";

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organizationName,
  onConfirm,
  isDeleting,
}: DeleteOrganizationDialogProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isConfirmValid = confirmText === organizationName;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDeleting) {
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen) {
      setConfirmText("");
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <DialogTitle className="text-2xl">Удалить организацию</DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Пожалуйста, подтвердите удаление.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Предупреждение о каскадном удалении</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Удаление организации приведет к безвозвратному удалению:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Всех рабочих пространств организации</li>
                <li>Всех интеграций и настроек</li>
                <li>Всех вакансий и откликов кандидатов</li>
                <li>Всех данных и файлов</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Введите <span className="font-semibold">{organizationName}</span>{" "}
              для подтверждения
            </Label>
            <Input
              ref={inputRef}
              id="confirm-name"
              type="text"
              placeholder={organizationName}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isConfirmValid && !isDeleting) {
                  handleConfirm();
                }
              }}
              disabled={isDeleting}
              autoComplete="off"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Название должно совпадать точно, включая регистр букв
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? "Удаление…" : "Удалить организацию"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
