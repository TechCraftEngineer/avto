"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { paths } from "@qbs-autonaim/config";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@qbs-autonaim/ui";
import { type OTPFormData, otpFormSchema } from "@qbs-autonaim/validators";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";
import { isValidInternalPath } from "~/lib/auth-utils";

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const [email, setEmail] = useState("");

  const form = useForm<OTPFormData>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    const storedEmail = localStorage.getItem("otp_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Redirect back to login if no email found
      router.push(paths.auth.signin);
    }
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: OTPFormData) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp: data.otp,
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        form.reset();
        return;
      }

      toast.success("Вход выполнен успешно!");

      // Очищаем сохраненные данные
      localStorage.removeItem("otp_email");

      // Проверяем наличие redirect URL
      const redirectUrl = localStorage.getItem("auth_redirect");
      localStorage.removeItem("auth_redirect");

      // Валидируем redirect URL перед использованием
      if (redirectUrl && isValidInternalPath(redirectUrl)) {
        router.push(redirectUrl);
      } else {
        // Для входа используем сохраненную организацию или редиректим на dashboard
        const lastOrgSlug = localStorage.getItem("lastOrganizationSlug");
        if (lastOrgSlug) {
          router.push(paths.organization.workspaces(lastOrgSlug));
        } else {
          router.push(paths.dashboard.root);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Неверный код. Попробуйте снова.");
      form.reset();
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
        type: "sign-in",
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      toast.success("Код отправлен! Проверьте вашу почту.");
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить код. Попробуйте снова.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Введите код подтверждения</CardTitle>
        <CardDescription>
          Мы отправили 6-значный код на {email}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="otp" className="sr-only">
                    Код подтверждения
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      id="otp"
                      {...field}
                      onChange={(value) => {
                        field.onChange(value);
                        if (value.length === 6) {
                          form.handleSubmit(onSubmit)();
                        }
                      }}
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
                  </FormControl>
                  <FormDescription className="text-center">
                    Введите 6-значный код, отправленный на вашу почту.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Проверка…" : "Подтвердить"}
            </Button>
            <FormDescription className="text-center">
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
            </FormDescription>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
