"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@qbs-autonaim/ui/components/sidebar";
import {
  IconBriefcase,
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconInbox,
  IconInnerShadowTop,
  IconMessage,
  IconPlus,
  IconSettings,
  IconUsersGroup,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type * as React from "react";
import { NavSecondary, WorkspaceSwitcher } from "~/components/sidebar";

const NavUser = dynamic(
  () =>
    import("~/components/sidebar/nav-user").then((mod) => ({
      default: mod.NavUser,
    })),
  {
    ssr: false,
  },
);

import {
  NavCollapsible,
  type NavSection,
} from "~/components/sidebar/nav-collapsible";
import { NavQuickActions } from "~/components/sidebar/nav-quick-actions";
import { useSidebarStats } from "~/components/sidebar/use-sidebar-stats";
import { useWorkspaces } from "~/contexts/workspace-context";

function getNavSections(
  orgSlug?: string,
  workspaceSlug?: string,
  stats?: {
    newResponses: number;
    activeVacancies: number;
    highScoreResponses: number;
  },
): NavSection[] {
  const baseUrl =
    orgSlug && workspaceSlug
      ? `/orgs/${orgSlug}/workspaces/${workspaceSlug}`
      : "";

  return [
    {
      title: "Обзор",
      defaultOpen: true,
      items: [
        {
          title: "Панель управления",
          url: baseUrl || paths.dashboard.root,
          icon: IconDashboard,
        },
      ],
    },
    {
      title: "Рекрутинг",
      defaultOpen: true,
      items: [
        {
          title: "Вакансии",
          url: baseUrl ? `${baseUrl}/vacancies` : "/vacancies",
          icon: IconFileDescription,
          badge: stats?.activeVacancies,
          badgeVariant: "default" as const,
        },
        {
          title: "Разовые задания",
          url: baseUrl ? `${baseUrl}/gigs` : "/gigs",
          icon: IconBriefcase,
        },
        {
          title: "Отклики",
          url: baseUrl ? `${baseUrl}/responses` : "/responses",
          icon: IconInbox,
          badge: stats?.newResponses,
          badgeVariant: stats?.newResponses
            ? ("destructive" as const)
            : undefined,
        },
        {
          title: "Кандидаты",
          url: baseUrl ? `${baseUrl}/candidates` : "/candidates",
          icon: IconUsersGroup,
          badge: stats?.highScoreResponses,
          badgeVariant: stats?.highScoreResponses
            ? ("success" as const)
            : undefined,
        },
      ],
    },
    {
      title: "Коммуникации",
      defaultOpen: true,
      items: [
        {
          title: "Чаты",
          url: baseUrl ? `${baseUrl}/chat` : "/chat",
          icon: IconMessage,
        },
        {
          title: "Воронка найма",
          url: baseUrl ? `${baseUrl}/funnel` : "/funnel",
          icon: IconChartBar,
        },
      ],
    },
  ];
}

const getNavSecondaryItems = (orgSlug?: string, workspaceSlug?: string) => [
  {
    title: "Настройки",
    url:
      orgSlug && workspaceSlug
        ? paths.workspace.settings.root(orgSlug, workspaceSlug)
        : "/settings",
    icon: IconSettings,
  },
];

const getQuickActions = (orgSlug?: string, workspaceSlug?: string) => {
  if (!orgSlug || !workspaceSlug) return [];

  return [
    {
      title: "Создать вакансию",
      url: paths.workspace.createVacancy(orgSlug, workspaceSlug),
      icon: IconPlus,
    },
  ];
};

export function AppSidebar({
  user,
  activeWorkspaceId,
  activeOrganizationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  activeWorkspaceId?: string;
  activeOrganizationId?: string;
}) {
  const { workspaces, organizations } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId);

  const { isError, isLoading, error, ...stats } =
    useSidebarStats(activeWorkspaceId);

  const navSections = getNavSections(
    activeWorkspace?.organizationSlug,
    activeWorkspace?.slug,
    isError ? undefined : stats,
  );

  const navSecondaryItems = getNavSecondaryItems(
    activeWorkspace?.organizationSlug,
    activeWorkspace?.slug,
  );

  const quickActions = getQuickActions(
    activeWorkspace?.organizationSlug,
    activeWorkspace?.slug,
  );

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link
                href={
                  activeWorkspace?.organizationSlug && activeWorkspace?.slug
                    ? paths.workspace.root(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      )
                    : paths.dashboard.root
                }
                className="overflow-hidden"
              >
                <IconInnerShadowTop className="size-5 shrink-0!" />
                <span className="text-base font-semibold truncate">
                  QBS Автонайм
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {workspaces && workspaces.length > 0 && organizations && (
          <WorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            activeOrganizationId={activeOrganizationId}
          />
        )}
        {isError && (
          <div className="px-2 py-1.5 text-xs text-destructive truncate">
            Не удалось загрузить статистику
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {quickActions.length > 0 && (
          <>
            <NavQuickActions actions={quickActions} />
            <SidebarSeparator />
          </>
        )}

        <NavCollapsible sections={navSections} />

        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
