"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@qbs-autonaim/ui";
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
  error?: string | null;
  onResendCode?: () => void;
  isResending?: boolean;
  /** Сбрасывает кулдаун после успешной повторной отправки */
  resendCountdownReset?: number;
}

export function HHVerificationCodeDialog({
  open,
  onClose,
  email,
  onSubmitCode,
  isLoading,
  error,
  onResendCode,
  isResending,
  resendCountdownReset = 0,
}: HHVerificationCodeDialogProps) {
  const [attempts, setAttempts] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(60);

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

  // Сброс кулдауна после успешной повторной отправки
  useEffect(() => {
    if (resendCountdownReset > 0) {
      setResendCountdown(60);
    }
  }, [resendCountdownReset]);

  const form = useForm<VerificationCodeValues>({
    resolver: async (data) => {
      try {
        const result = verificationCodeSchema.safeParse(data);
        if (!result.success) {
          return {
            values: {},
            errors: result.error.issues.reduce(
              (acc, issue) => {
                const path = issue.path[0] as string;
                acc[path] = {
                  type: issue.code,
                  message: issue.message,
                };
                return acc;
              },
              {} as Record<string, { type: string; message: string }>,
            ),
          };
        }
        return { values: result.data, errors: {} };
      } catch {
        return { values: {}, errors: {} };
      }
    },
    defaultValues: { code: "" },
  });

  const handleSubmit = (data: VerificationCodeValues) => {
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
            Подтверждение входа в hh.ru
          </DialogTitle>
          <DialogDescription className="text-base">
            Введите код, отправленный на {email}
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
                <FormItem>
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
                      disabled={isLoading}
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
                  {onResendCode && (
                    <FormDescription
                      id="code-description"
                      className="text-xs text-center"
                    >
                      Код не пришёл?{" "}
                      <button
                        type="button"
                        onClick={onResendCode}
                        disabled={
                          isResending ||
                          attempts >= 3 ||
                          resendCountdown > 0
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

            {attempts > 0 && attempts >= 3 && (
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
                disabled={isLoading}
                className="h-11"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.watch("code")?.trim()}
                className="h-11"
              >
                {isLoading ? "Проверка…" : "Подтвердить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
