"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui";
import type { Icon } from "@tabler/icons-react";
import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "success";
};

export type NavSection = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

export function NavCollapsible({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => (
        <NavCollapsibleSection
          key={section.title}
          section={section}
          pathname={pathname}
        />
      ))}
    </>
  );
}

function NavCollapsibleSection({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  const isItemActive = (itemUrl: string) =>
    pathname === itemUrl || pathname.startsWith(`${itemUrl}/`);

  const hasActiveItem = section.items.some((item) => isItemActive(item.url));
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? hasActiveItem);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer select-none hover:bg-sidebar-accent/50 rounded-md transition-colors">
            <span className="flex-1">{section.title}</span>
            <IconChevronDown
              className={`size-4 transition-transform duration-200 ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <NavCollapsibleItem
                  key={item.title}
                  item={item}
                  isActive={isItemActive(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function NavCollapsibleItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
        <Link href={item.url} className="overflow-hidden">
          {item.icon && <item.icon className="shrink-0" />}
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge !== undefined && item.badge > 0 && (
        <SidebarMenuBadge
          className={cn(
            "min-w-5 h-5 px-1.5 flex items-center justify-center rounded-md text-[10px] font-medium tabular-nums transition-colors",
            item.badgeVariant === "destructive" &&
              "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
            item.badgeVariant === "success" &&
              "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
            (item.badgeVariant === "default" || !item.badgeVariant) &&
              "bg-sidebar-primary/10 text-sidebar-primary dark:bg-sidebar-primary/20",
          )}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}
