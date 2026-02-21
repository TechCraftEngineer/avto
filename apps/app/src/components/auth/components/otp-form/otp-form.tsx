"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Field, FieldLabel } from "@qbs-autonaim/ui/components/field"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@qbs-autonaim/ui/components/form"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@qbs-autonaim/ui/components/input-otp";
import { type OTPFormData, otpFormSchema } from "@qbs-autonaim/validators";
import { RefreshCwIcon } from "lucide-react";
import Link from "next/link";
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="gap-4">
            <CardTitle className="text-xl">Введите код подтверждения</CardTitle>
            <CardDescription>
              Мы отправили 6-значный код на{" "}
              <span className="text-foreground font-medium">{email}</span>.
              Введите код, который вы получили.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="gap-4">
                  <Field className="gap-4" orientation="vertical">
                    <div className="flex items-center justify-between">
                      <FieldLabel
                        htmlFor="otp-verification"
                        className="sr-only"
                      >
                        Код подтверждения
                      </FieldLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleResend}
                        disabled={countdown > 0 || resending}
                      >
                        <RefreshCwIcon
                          className="size-3"
                          data-slot="inline-start"
                          aria-hidden
                        />
                        {resending
                          ? "Отправка…"
                          : countdown > 0
                            ? `Отправить повторно (${countdown}с)`
                            : "Отправить повторно"}
                      </Button>
                    </div>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        id="otp-verification"
                        required
                        containerClassName="justify-center"
                        {...field}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value.length === 6) {
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      >
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  </Field>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Проверка…" : "Подтвердить"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Проблемы со входом?{" "}
              <Link
                href={paths.auth.signin}
                className="text-primary underline-offset-4 transition-colors hover:underline"
              >
                Вернуться на страницу входа
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
