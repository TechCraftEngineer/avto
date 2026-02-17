import { paths } from "@qbs-autonaim/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Разрешаем доступ к /auth/verify-email и /auth/reset-password для авторизованных пользователей
  const isVerifyEmailPage = pathname === "/auth/verify-email";
  const isResetPasswordPage = pathname === "/auth/reset-password";

  // Если пользователь уже авторизован и это не страница верификации или сброса пароля, редиректим на главную
  if (session?.user && !isVerifyEmailPage && !isResetPasswordPage) {
    redirect(paths.dashboard.root);
  }

  return <>{children}</>;
}
