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
import { Label } from "./label";

interface DeleteVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (option: "anonymize" | "delete") => void;
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
  const [selectedOption, setSelectedOption] = React.useState<
    "anonymize" | "delete"
  >("anonymize");

  const handleConfirm = () => {
    onConfirm(selectedOption);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить вакансию?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы собираетесь удалить вакансию "{vacancyTitle}". Это действие
            нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Выберите, что делать с персональными данными фрилансеров:
          </p>

          <div className="space-y-3">
            <label
              htmlFor="option-anonymize"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              style={{ minHeight: "44px" }}
            >
              <input
                type="radio"
                id="option-anonymize"
                name="cleanup-option"
                value="anonymize"
                checked={selectedOption === "anonymize"}
                onChange={(e) =>
                  setSelectedOption(e.target.value as "anonymize" | "delete")
                }
                className="mt-0.5 h-4 w-4 shrink-0"
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label
                  htmlFor="option-anonymize"
                  className="cursor-pointer font-medium"
                >
                  Анонимизировать данные
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Персональные данные фрилансеров будут заменены на
                  анонимизированные значения. Статистика и оценки сохранятся.
                </p>
              </div>
            </label>

            <label
              htmlFor="option-delete"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              style={{ minHeight: "44px" }}
            >
              <input
                type="radio"
                id="option-delete"
                name="cleanup-option"
                value="delete"
                checked={selectedOption === "delete"}
                onChange={(e) =>
                  setSelectedOption(e.target.value as "anonymize" | "delete")
                }
                className="mt-0.5 h-4 w-4 shrink-0"
                disabled={isLoading}
              />
              <div className="flex-1">
                <Label
                  htmlFor="option-delete"
                  className="cursor-pointer font-medium"
                >
                  Удалить все данные
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Вакансия и все связанные данные фрилансеров будут полностью
                  удалены из системы.
                </p>
              </div>
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
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
