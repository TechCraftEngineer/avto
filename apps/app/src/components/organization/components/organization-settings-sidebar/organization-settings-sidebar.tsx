"use client";

import { cn } from "@qbs-autonaim/ui";
import { AlertTriangle, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarNavItems = [
  {
    title: "Общие",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Участники",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "Опасная зона",
    href: "/settings/danger",
    icon: AlertTriangle,
    variant: "destructive" as const,
  },
];

export function OrganizationSettingsSidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => {
        const href = `/orgs/${orgSlug}${item.href}`;
        const isActive = pathname === href;
        const isDestructive = item.variant === "destructive";

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              isActive
                ? "bg-accent text-foreground"
                : isDestructive
                  ? "text-destructive hover:text-destructive"
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
