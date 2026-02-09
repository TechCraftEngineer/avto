"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@qbs-autonaim/ui";
import { loginFormSchema } from "@qbs-autonaim/validators";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";

interface EmailVerificationFormProps {
  email?: string;
}

export function EmailVerificationForm({
  email,
  ...props
}: EmailVerificationFormProps & React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push(paths.auth.signin);
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      toast.error("Email не указан. Вернитесь на страницу входа.");
      return;
    }

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

      setCodeSent(true);
      toast.success("Код отправлен! Проверьте вашу почту.");
      setCountdown(60);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить код. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      toast.success("Код отправлен! Проверьте вашу почту.");
      setCountdown(60);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить код. Попробуйте снова.");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!email) {
      toast.error("Email не указан");
      return;
    }

    if (otpCode.length !== 6) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        setOtpCode("");
        return;
      }

      toast.success("Email успешно подтвержден!");

      localStorage.removeItem("email-verification-dismissed");

      setTimeout(() => {
        router.push(paths.dashboard.root);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось подтвердить код. Попробуйте снова.");
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  if (!codeSent) {
    return (
      <Card {...props}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Подтвердите ваш email</CardTitle>
          <CardDescription>
            Для продолжения работы необходимо подтвердить ваш email адрес. Мы
            отправим вам код подтверждения на почту.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-sm font-medium">{email}</p>
            </div>
          )}
          <Button
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Отправка…" : "Отправить код на email"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Введите код подтверждения</CardTitle>
        <CardDescription>
          Мы отправили 6-значный код на {email}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value);
                if (value.length === 6) {
                  handleVerify();
                }
              }}
              disabled={loading}
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            Введите 6-значный код, отправленный на вашу почту.
          </p>
        </div>
        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={loading || otpCode.length !== 6}
        >
          {loading ? "Проверка…" : "Подтвердить"}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Не получили код?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="text-primary underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {resending
              ? "Отправка…"
              : countdown > 0
                ? `Отправить повторно (${countdown}с)`
                : "Отправить повторно"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
