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

  // Разрешаем доступ к /auth/verify-email для авторизованных пользователей
  const isVerifyEmailPage = pathname === "/auth/verify-email";

  // Если пользователь уже авторизован и это не страница верификации, редиректим на главную
  if (session?.user && !isVerifyEmailPage) {
    redirect(paths.dashboard.root);
  }

  return <>{children}</>;
}
