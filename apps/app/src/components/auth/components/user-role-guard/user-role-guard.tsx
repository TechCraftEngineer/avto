"use client";

import { paths } from "@qbs-autonaim/config";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { authClient } from "~/auth/client";

interface UserRoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Компонент для защиты контента на основе роли пользователя
 * Использует customSession для получения роли из сессии без запроса к БД
 */
export function UserRoleGuard({
  children,
  allowedRoles,
  redirectTo = paths.accessDenied,
}: UserRoleGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session) {
      const userRole =
        (session.user as { role?: string } | undefined)?.role ?? "user";
      if (!allowedRoles.includes(userRole)) {
        router.push(redirectTo);
      }
    }
  }, [session, isPending, allowedRoles, redirectTo, router]);

  if (isPending) {
    return <div>Загрузка...</div>;
  }

  const userRole =
    (session?.user as { role?: string } | undefined)?.role ?? "user";
  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
