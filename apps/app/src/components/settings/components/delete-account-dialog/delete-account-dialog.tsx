"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Label,
} from "@qbs-autonaim/ui";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { getAvatarUrl } from "~/lib/avatar";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatar?: string | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userAvatar,
  onConfirm,
  isDeleting = false,
}: DeleteAccountDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");

  const confirmPhrase = "удалить мой аккаунт";
  const isConfirmValid = confirmInput === confirmPhrase;
  const canDelete = isConfirmValid && !isDeleting;

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmInput("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={getAvatarUrl(userAvatar, "User")} />
              <AvatarFallback className="text-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Удалить аккаунт
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            Внимание: Это безвозвратно удалит ваш аккаунт, все ваши workspace,
            ссылки и их статистику.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-input" className="text-sm font-medium">
              Для подтверждения введите{" "}
              <span className="font-semibold">{confirmPhrase}</span> ниже:
            </Label>
            <Input
              id="confirm-input"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmPhrase}
              disabled={isDeleting}
              className={
                confirmInput && !isConfirmValid
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete}
            className="w-full"
          >
            {isDeleting ? "Удаление..." : "Подтвердить удаление аккаунта"}
          </Button>
          <AlertDialogCancel
            disabled={isDeleting}
            className="w-full mt-0"
            onClick={() => handleOpenChange(false)}
          >
            Отмена
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
