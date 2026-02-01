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
  PasswordInput,
} from "@qbs-autonaim/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "~/auth/client";
import { translateAuthError } from "~/lib/auth-error-messages";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Неверная ссылка для сброса");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      toast.success("Пароль успешно сброшен!");
      router.push(paths.auth.signin);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось сбросить пароль. Возможно, ссылка устарела.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card {...props}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Неверная ссылка</CardTitle>
          <CardDescription>
            Эта ссылка для сброса пароля недействительна или устарела.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={paths.auth.forgotPassword}>Запросить новую ссылку</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Сброс пароля</CardTitle>
        <CardDescription>Введите новый пароль ниже.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтвердите пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Сброс пароля…" : "Сбросить пароль"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
