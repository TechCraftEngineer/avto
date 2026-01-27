"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui";
import { loginFormSchema } from "@qbs-autonaim/validators/login";
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
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);
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

  const handleResend = async () => {
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
      toast.success("Письмо с подтверждением отправлено! Проверьте почту.");

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
      toast.error("Не удалось отправить письмо. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push(paths.auth.signin);
  };

  const isDisabled = loading || cooldown > 0 || !email;

  return (
    <div className="w-full space-y-4">
      {resent && (
        <div className="bg-green-50 text-green-700 flex items-center gap-2 rounded-lg p-3 text-sm">
          <CheckCircle className="size-4" />
          <span>Письмо успешно отправлено!</span>
        </div>
      )}

      <Button
        onClick={handleResend}
        disabled={isDisabled}
        className="w-full"
        variant="default"
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
            Отправить письмо повторно
          </>
        )}
      </Button>

      <Button
        onClick={handleBackToLogin}
        variant="outline"
        className="w-full"
        disabled={loading}
      >
        Вернуться ко входу
      </Button>
    </div>
  );
}
