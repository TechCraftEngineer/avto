import { paths } from "@qbs-autonaim/config";
import {
  SidebarInset,
  SidebarProvider,
} from "@qbs-autonaim/ui/components/sidebar";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";

export const dynamic = "force-dynamic";

import { EmailVerificationBanner } from "~/components/auth";
import { SiteHeader } from "~/components/layout";
import { DatabaseErrorFallback } from "~/components/shared/database-error-fallback";
import { AppSidebarWrapper } from "~/components/sidebar";
import { WorkspaceProvider } from "~/contexts/workspace-context";
import { api } from "~/orpc/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session: Awaited<ReturnType<typeof getSession>>;
  let userWorkspaces: Awaited<
    ReturnType<Awaited<ReturnType<typeof api>>["workspace"]["list"]>
  >;
  let userOrganizations: Awaited<
    ReturnType<Awaited<ReturnType<typeof api>>["organization"]["list"]>
  >;

  try {
    session = await getSession();
  } catch (error) {
    console.error("[DashboardLayout] Ошибка получения сессии:", error);

    // Проверяем, является ли это ошибкой подключения к БД
    const isConnectionError =
      error instanceof Error &&
      (error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("Failed query") ||
        error.message?.includes("Connection") ||
        error.message?.includes("Database") ||
        error.message?.includes("подключиться к базе данных"));

    if (isConnectionError) {
      return <DatabaseErrorFallback />;
    }

    // Для других ошибок выбрасываем дальше
    throw error;
  }

  // Редирект на /auth/signin обрабатывается в middleware
  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  try {
    const caller = await api();
    [userWorkspaces, userOrganizations] = await Promise.all([
      caller.workspace.list(),
      caller.organization.list(),
    ]);
  } catch (error) {
    console.error("[DashboardLayout] Ошибка загрузки данных:", error);

    // Проверяем, является ли это ошибкой подключения к БД
    const isConnectionError =
      error instanceof Error &&
      (error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("Failed query") ||
        error.message?.includes("Connection") ||
        error.message?.includes("Database"));

    if (isConnectionError) {
      return <DatabaseErrorFallback />;
    }

    throw error;
  }

  // Если нет workspaces, редирект на создание
  // (логика с приглашениями обрабатывается на странице /invite/[token])
  if (userWorkspaces.length === 0) {
    redirect(paths.onboarding.root);
  }

  // Преобразуем данные для компонента
  const workspaces = userWorkspaces.map((uw) => ({
    id: uw.workspace.id,
    name: uw.workspace.name,
    slug: uw.workspace.slug,
    logo: uw.workspace.logo,
    role: uw.role,
    organizationSlug: uw.workspace.organization?.slug,
    organizationId: uw.workspace.organizationId,
  }));

  const organizations = userOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    role: (org as typeof org & { role: "owner" | "admin" | "member" }).role,
    memberCount: (org as typeof org & { memberCount: number }).memberCount,
    workspaceCount: (org as typeof org & { workspaceCount: number })
      .workspaceCount,
    plan: org.plan,
  }));

  return (
    <NuqsAdapter>
      <WorkspaceProvider workspaces={workspaces} organizations={organizations}>
        <SidebarProvider>
          <AppSidebarWrapper
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image || "",
            }}
          />
          <SidebarInset>
            <SiteHeader
              user={{
                name: session.user.name,
                email: session.user.email,
                avatar: session.user.image || "",
              }}
            />
            <div className="bg-muted/40 flex flex-1 flex-col">
              <div className="p-[var(--content-padding)] xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto @container/main">
                <EmailVerificationBanner session={session} />
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </WorkspaceProvider>
    </NuqsAdapter>
  );
}
