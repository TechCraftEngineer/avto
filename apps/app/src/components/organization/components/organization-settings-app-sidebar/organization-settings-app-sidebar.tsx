"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui";
import {
  IconArrowLeft,
  IconChartBar,
  IconCreditCard,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavUser } from "~/components/sidebar";

const organizationNavItems = [
  {
    title: "Использование",
    href: "/settings/usage",
    icon: IconChartBar,
  },
  {
    title: "Биллинг",
    href: "/settings/billing",
    icon: IconCreditCard,
    badge: true,
  },
  {
    title: "Команда",
    href: "/settings/members",
    icon: IconUsers,
  },
  {
    title: "Настройки",
    href: "/settings",
    icon: IconSettings,
  },
];

export function OrganizationSettingsAppSidebar({
  orgSlug,
  organizationPlan,
  user,
}: {
  orgSlug: string;
  organizationPlan?: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar variant="floating" collapsible="offcanvas">
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => {
                  router.push(paths.organization.workspaces(orgSlug));
                }}
                className="cursor-pointer"
              >
                <IconArrowLeft className="size-4" />
                <span className="font-medium">Назад в приложение</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs">
            Организация
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {organizationNavItems.map((item) => {
                const href = `/orgs/${orgSlug}${item.href}`;
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && organizationPlan && (
                          <span className="ml-auto text-primary text-xs">
                            {organizationPlan}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
