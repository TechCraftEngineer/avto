import { paths } from "@qbs-autonaim/config";
import { SidebarInset, SidebarProvider } from "@qbs-autonaim/ui";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { GettingStartedContainer } from "~/components/getting-started";
import { SiteHeader } from "~/components/layout";
import { AppSidebarWrapper } from "~/components/sidebar";
import { WorkspaceProvider } from "~/contexts/workspace-context";
import { api } from "~/trpc/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Редирект на /auth/signin обрабатывается в middleware
  if (!session?.user) {
    return null;
  }

  const caller = await api();
  const [userWorkspaces, userOrganizations] = await Promise.all([
    caller.workspace.list(),
    caller.organization.list(),
  ]);

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
  }));

  return (
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
            <div className="@container/main p-[var(--content-padding)] xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
        <div className="hidden md:block">
          <GettingStartedContainer />
        </div>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
