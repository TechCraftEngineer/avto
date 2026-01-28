"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from "@qbs-autonaim/ui";
import { loginFormSchema } from "@qbs-autonaim/validators";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";

interface EmailVerificationFormProps {
  email?: string;
}

export function EmailVerificationForm({ email }: EmailVerificationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка интервала при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error(
        "Email не указан. Вернитесь на страницу входа и попробуйте снова.",
      );
      return;
    }

    // Валидация email перед отправкой
    const validation = loginFormSchema.shape.email.safeParse(email);
    if (!validation.success) {
      toast.error("Некорректный email адрес");
      return;
    }

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

      setResent(true);
      setShowOtpInput(true);
      toast.success("Код подтверждения отправлен на ваш email!");

      // Очищаем предыдущий интервал если есть
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Устанавливаем кулдаун 60 секунд
      setCooldown(60);
      intervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить код. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email) {
      toast.error("Email не указан");
      return;
    }

    if (!otpCode || otpCode.length < 6) {
      toast.error("Введите корректный код из 6 цифр");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      toast.success("Email успешно подтвержден!");

      // Сбрасываем флаг dismissed баннера
      localStorage.removeItem("email-verification-dismissed");

      // Перенаправляем на главную страницу
      setTimeout(() => {
        router.push(paths.dashboard.root);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось подтвердить код. Попробуйте снова.");
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToLogin = () => {
    router.push(paths.auth.signin);
  };

  const isSendDisabled = loading || cooldown > 0 || !email;

  return (
    <div className="w-full space-y-4">
      {resent && (
        <div className="bg-green-50 text-green-700 flex items-center gap-2 rounded-lg p-3 text-sm">
          <CheckCircle className="size-4" />
          <span>Код успешно отправлен!</span>
        </div>
      )}

      {showOtpInput && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="otp-code" className="text-center block">
              Код подтверждения
            </Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={verifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-muted-foreground text-center text-xs">
              Введите код из письма, отправленного на {email}
            </p>
          </div>

          <Button
            onClick={handleVerifyOtp}
            disabled={verifying || otpCode.length !== 6}
            className="w-full"
            variant="default"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Проверка кода...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" />
                Подтвердить email
              </>
            )}
          </Button>
        </div>
      )}

      <Button
        onClick={handleSendOtp}
        disabled={isSendDisabled}
        className="w-full"
        variant={showOtpInput ? "outline" : "default"}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Отправка...
          </>
        ) : cooldown > 0 ? (
          <>
            <Mail className="mr-2 size-4" />
            Отправить повторно ({cooldown}s)
          </>
        ) : (
          <>
            <Mail className="mr-2 size-4" />
            {showOtpInput ? "Отправить код повторно" : "Отправить код на email"}
          </>
        )}
      </Button>

      <Button
        onClick={handleBackToLogin}
        variant="outline"
        className="w-full"
        disabled={loading || verifying}
      >
        Вернуться ко входу
      </Button>
    </div>
  );
}
