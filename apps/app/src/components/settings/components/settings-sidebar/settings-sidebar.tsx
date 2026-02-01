"use client";

import { paths } from "@qbs-autonaim/config";
import { cn } from "@qbs-autonaim/ui";
import {
  Bot,
  Globe,
  Globe2,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

const sidebarNavItems = [
  {
    title: "Рабочее пространство",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Участники",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "AI-бот",
    href: "/settings/bot",
    icon: Bot,
  },
  {
    title: "Домены",
    href: "/settings/domains",
    icon: Globe2,
  },
  {
    title: "Интеграции",
    href: "/settings/integrations",
    icon: Globe,
  },
  {
    title: "Сценарии интервью",
    href: "/settings/interview-scenarios",
    icon: MessageSquare,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const { orgSlug, slug } = useWorkspaceParams();

  if (!orgSlug || !slug) return null;

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => {
        const href = `${paths.workspace.root(orgSlug, slug)}${item.href}`;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === href
                ? "bg-accent text-foreground"
                : "text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
