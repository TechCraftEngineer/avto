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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@qbs-autonaim/ui";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";

const forgotPasswordSchema = z.object({
  email: z.string().email("Неверный email адрес"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: paths.auth.resetPassword,
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      setSent(true);
      toast.success("Ссылка для сброса пароля отправлена! Проверьте email.");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отправить ссылку. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card {...props}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Проверьте email</CardTitle>
          <CardDescription>
            Мы отправили ссылку для сброса пароля на ваш email адрес.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Нажмите на ссылку в письме, чтобы сбросить пароль. Ссылка
              действительна в течение 1 часа.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href={paths.auth.signin}>Вернуться ко входу</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Забыли пароль?</CardTitle>
        <CardDescription>
          Введите ваш email адрес и мы отправим вам ссылку для сброса пароля.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Отправка…" : "Отправить ссылку"}
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href={paths.auth.signin}>Вернуться ко входу</Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
