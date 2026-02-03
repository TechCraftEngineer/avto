"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface DeleteVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  vacancyTitle: string;
  isLoading?: boolean;
}

export function DeleteVacancyDialog({
  open,
  onOpenChange,
  onConfirm,
  vacancyTitle,
  isLoading = false,
}: DeleteVacancyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить вакансию?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы собираетесь удалить вакансию "{vacancyTitle}". Вакансия и все
            связанные данные (отклики, статистика) будут безвозвратно удалены.
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "Удаление…" : "Удалить вакансию"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
