"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

type QuickAction = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export function NavQuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null;

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {actions.map((action) => (
            <SidebarMenuItem key={action.title}>
              <SidebarMenuButton
                tooltip={action.title}
                variant="outline"
                className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                asChild
              >
                <Link href={action.url} className="overflow-hidden">
                  {action.icon ? (
                    <action.icon className="size-4 shrink-0" />
                  ) : (
                    <IconPlus className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{action.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
