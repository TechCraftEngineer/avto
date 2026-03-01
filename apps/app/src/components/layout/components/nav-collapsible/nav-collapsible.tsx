"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@qbs-autonaim/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui/components/sidebar";
import { cn } from "@qbs-autonaim/ui/utils";
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

function getActiveItemUrl(
  pathname: string,
  sections: NavSection[],
): string | undefined {
  const allItems = sections.flatMap((s) => s.items);
  const matching = allItems
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
    )
    .sort((a, b) => b.url.length - a.url.length);
  return matching[0]?.url;
}

export function NavCollapsible({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const activeItemUrl = getActiveItemUrl(pathname, sections);

  return (
    <>
      {sections.map((section) => (
        <NavCollapsibleSection
          key={section.title}
          section={section}
          activeItemUrl={activeItemUrl}
        />
      ))}
    </>
  );
}

function NavCollapsibleSection({
  section,
  activeItemUrl,
}: {
  section: NavSection;
  activeItemUrl: string | undefined;
}) {
  const isItemActive = (itemUrl: string) => activeItemUrl === itemUrl;

  const hasActiveItem = section.items.some(
    (item) => activeItemUrl === item.url,
  );
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
