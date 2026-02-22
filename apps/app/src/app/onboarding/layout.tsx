import { paths } from "@qbs-autonaim/config";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { api } from "~/orpc/server";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  // Проверяем, есть ли у пользователя workspaces
  const caller = await api();
  const userWorkspaces = await caller.workspace.list();

  // Если есть workspaces, редиректим на главную
  if (userWorkspaces.length > 0) {
    redirect(paths.dashboard.root);
  }

  return <>{children}</>;
}
