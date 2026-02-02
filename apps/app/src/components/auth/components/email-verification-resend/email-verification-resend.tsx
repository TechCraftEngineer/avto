"use client";

import Button from "@qbs-autonaim/ui/button";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";

interface EmailVerificationResendProps {
  email: string;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function EmailVerificationResend({
  email,
  className,
  variant = "default",
  size = "default",
}: EmailVerificationResendProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const resendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка интервала при размонтировании
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
    };
  }, []);

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      toast.success("Письмо с подтверждением отправлено! Проверьте почту.");

      // Очищаем предыдущий интервал если есть
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }

      // Устанавливаем кулдаун 60 секунд
      setCooldown(60);
      resendIntervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (resendIntervalRef.current) {
              clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить письмо. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0;

  return (
    <Button
      onClick={handleResend}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={className}
    >
      {loading
        ? "Отправка..."
        : cooldown > 0
          ? `Отправить повторно (${cooldown}s)`
          : "Отправить письмо повторно"}
    </Button>
  );
}

