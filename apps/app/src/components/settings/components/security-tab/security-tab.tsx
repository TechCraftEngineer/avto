"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { paths } from "@qbs-autonaim/config";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  PasswordInput,
} from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";
import { DeleteAccountDialog } from "./delete-account-dialog";

interface SecurityTabProps {
  user: RouterOutputs["user"]["me"];
}

export function SecurityTab({ user }: SecurityTabProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);

  // Проверяем есть ли credential аккаунт (пароль)
  const hasPassword = user?.accounts?.some(
    (account) => account.providerId === "credential",
  );

  // Определяем провайдера для социального аккаунта
  const socialProvider = user?.accounts?.find(
    (account) => account.providerId !== "credential",
  )?.providerId;

  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;

  const isPasswordValid =
    hasNumber && hasUppercase && hasLowercase && hasMinLength;

  const handleChangePassword = async () => {
    if (!isPasswordValid) {
      toast.error("Пароль не соответствует требованиям");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (error) {
        toast.error(error.message ?? "Не удалось изменить пароль");
        return;
      }

      toast.success("Пароль успешно изменен");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Не удалось изменить пароль");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreatePassword = async () => {
    if (!user?.email) return;

    setIsSendingResetLink(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: user.email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message ?? "Не удалось отправить ссылку");
        return;
      }

      toast.success("Ссылка для создания пароля отправлена на ваш email");
    } catch {
      toast.error("Не удалось отправить ссылку");
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const deleteAccount = useMutation(
    trpc.user.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Аккаунт успешно удален");
        router.push(paths.auth.signin);
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось удалить аккаунт";
        toast.error(message);
      },
    }),
  );

  const handleDeleteAccount = () => {
    deleteAccount.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Пароль</CardTitle>
          <CardDescription>
            {!hasPassword && socialProvider
              ? `Ваш аккаунт управляется через ${socialProvider === "google" ? "Google" : socialProvider}. Вы можете установить пароль для входа в аккаунт.`
              : "Управляйте паролем вашего аккаунта."}
          </CardDescription>
        </CardHeader>

        {!hasPassword ? (
          <CardFooter className="px-6 py-4">
            <Button
              onClick={handleCreatePassword}
              disabled={isSendingResetLink}
            >
              {isSendingResetLink ? "Отправка…" : "Создать пароль аккаунта"}
            </Button>
          </CardFooter>
        ) : (
          <>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Текущий пароль</Label>
                <PasswordInput
                  id="current-password"
                  name="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  disabled={isChangingPassword}
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <PasswordInput
                  id="new-password"
                  name="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  disabled={isChangingPassword}
                  autoComplete="new-password"
                />

                {newPassword && (
                  <div className="flex flex-wrap items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <div
                      className={`flex items-center gap-1.5 transition-colors duration-300 ${hasNumber ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {hasNumber ? (
                        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>Цифра</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 transition-colors duration-300 ${hasUppercase ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {hasUppercase ? (
                        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>Заглавная буква</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 transition-colors duration-300 ${hasLowercase ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {hasLowercase ? (
                        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>Строчная буква</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 transition-colors duration-300 ${hasMinLength ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {hasMinLength ? (
                        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>8 символов</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !isPasswordValid
                }
              >
                {isChangingPassword ? "Обновление…" : "Обновить пароль"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Удалить аккаунт</CardTitle>
          <CardDescription>
            Безвозвратно удалит ваш аккаунт со всеми workspace, вакансиями и
            откликами. Это действие невозможно отменить.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-destructive/50 px-6 py-4 flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Удалить аккаунт
          </Button>
        </CardFooter>
      </Card>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userAvatar={user?.image}
        onConfirm={handleDeleteAccount}
        isDeleting={deleteAccount.isPending}
      />
    </div>
  );
}
