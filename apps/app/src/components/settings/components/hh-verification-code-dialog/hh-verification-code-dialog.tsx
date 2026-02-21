"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@qbs-autonaim/ui/components/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@qbs-autonaim/ui/components/form"
import { Input } from "@qbs-autonaim/ui/components/input"
import { Spinner } from "@qbs-autonaim/ui/components/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const verificationCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Введите код")
    .regex(/^\d+$/, "Код должен содержать только цифры"),
});

type VerificationCodeValues = z.infer<typeof verificationCodeSchema>;

interface HHVerificationCodeDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onSubmitCode: (code: string) => void;
  isLoading: boolean;
  /** Код принят — ждём завершения job (отображаем прогресс) */
  isCodeAccepted?: boolean;
  error?: string | null;
  onResendCode?: () => void;
  isResending?: boolean;
}

export function HHVerificationCodeDialog({
  open,
  onClose,
  email,
  onSubmitCode,
  isLoading,
  isCodeAccepted = false,
  error,
  onResendCode,
  isResending,
}: HHVerificationCodeDialogProps) {
  const [attempts, setAttempts] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(60);

  const showLoader = isLoading || isCodeAccepted;

  // Кулдаун 60 сек — кнопка «Отправить повторно» на hh.ru (data-qa="oauth-merge-by-code__code-resend") появляется через минуту
  useEffect(() => {
    if (!open || !onResendCode) return;
    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, onResendCode]);

  const form = useForm<VerificationCodeValues>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: { code: "" },
  });

  const handleSubmit = (data: VerificationCodeValues) => {
    if (attempts >= 3) return;
    setAttempts((prev) => prev + 1);
    onSubmitCode(data.code);
  };

  const handleClose = () => {
    form.reset();
    setAttempts(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            {showLoader
              ? "Завершаем подключение"
              : "Подтверждение входа в hh.ru"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {showLoader
              ? "Код принят. Ожидаем завершения проверки на стороне hh.ru…"
              : `Введите код, отправленный на ${email}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className={showLoader ? "sr-only" : undefined}>
                  <FormLabel className="text-sm font-medium">
                    Код подтверждения
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Код из письма или SMS"
                      disabled={isLoading || showLoader}
                      autoComplete="one-time-code"
                      aria-describedby={
                        onResendCode ? "code-description" : undefined
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                      className="text-center tabular-nums"
                    />
                  </FormControl>
                  {onResendCode && !showLoader && (
                    <FormDescription
                      id="code-description"
                      className="text-xs text-center"
                    >
                      Код не пришёл?{" "}
                      <button
                        type="button"
                        onClick={onResendCode}
                        disabled={
                          isResending || attempts >= 3 || resendCountdown > 0
                        }
                        className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResending
                          ? "Отправка…"
                          : attempts >= 3
                            ? "Попробуйте позже"
                            : resendCountdown > 0
                              ? `Отправить повторно (${resendCountdown}с)`
                              : "Отправить повторно"}
                      </button>
                    </FormDescription>
                  )}
                  {error && (
                    <FormMessage className="text-center">
                      <span className="text-destructive">{error}</span>
                    </FormMessage>
                  )}
                  {!error && form.formState.errors.code && (
                    <FormMessage className="text-center" />
                  )}
                </FormItem>
              )}
            />

            {showLoader && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Код принят. Ожидаем подтверждения от hh.ru…
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Обычно занимает до 30 секунд
                </p>
              </div>
            )}
            {attempts > 0 && attempts >= 3 && !showLoader && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Превышено количество попыток.</p>
                <p>Подождите немного или попробуйте войти по паролю.</p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading && !showLoader}
                title={
                  showLoader
                    ? "Проверка идёт в фоне — можно закрыть"
                    : undefined
                }
                className="h-11"
              >
                Отмена
              </Button>
              {!showLoader && (
                <Button
                  type="submit"
                  disabled={
                    isLoading || !form.watch("code")?.trim() || attempts >= 3
                  }
                  className="h-11"
                >
                  {isLoading && <Spinner className="h-4 w-4" />}
                  {isLoading ? "Отправка…" : "Подтвердить"}
                </Button>
              )}
              {showLoader && (
                <Button disabled className="h-11">
                  <Spinner className="h-4 w-4" />
                  Завершаем подключение…
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
