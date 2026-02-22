"use client";

import { paths } from "@qbs-autonaim/config";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@qbs-autonaim/ui/components/sidebar";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconCreditCard,
  IconPlus,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CreateOrganizationDialog } from "~/components/organization/components";
import { CreateWorkspaceDialog } from "~/components/workspace/components";
import { useWorkspaces } from "~/contexts/workspace-context";
import { getPluralForm } from "~/lib/pluralization";
import { useTRPC } from "~/trpc/react";

const PLAN_LABELS: Record<string, string> = {
  free: "Бесплатный",
  starter: "Стартовый",
  pro: "Профессиональный",
  enterprise: "Корпоративный",
} as const;

function getPlanLabel(plan?: string | null) {
  return PLAN_LABELS[plan ?? "free"] ?? "Бесплатный";
}

function getPlanBadgeVariant(
  plan?: string | null,
): "secondary" | "default" | "outline" {
  if (plan === "pro") return "default";
  if (plan === "enterprise") return "default";
  if (plan === "starter") return "outline";
  return "secondary";
}

export function WorkspaceSwitcher({
  activeWorkspaceId,
  activeOrganizationId,
}: {
  activeWorkspaceId?: string;
  activeOrganizationId?: string;
}) {
  const {
    workspaces,
    organizations,
    workspace: contextWorkspace,
  } = useWorkspaces();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: setActiveWorkspace } = useMutation(
    trpc.user.setActiveWorkspace.mutationOptions(),
  );

  // Используем воркспейс из контекста (определяется по URL) или fallback
  const activeWorkspace = React.useMemo(() => {
    if (contextWorkspace) return contextWorkspace;
    if (activeWorkspaceId) {
      return workspaces.find((w) => w.id === activeWorkspaceId);
    }
    return workspaces.length > 0 ? workspaces[0] : undefined;
  }, [contextWorkspace, activeWorkspaceId, workspaces]);

  // Определяем активную организацию по воркспейсу
  const activeOrganization = React.useMemo(() => {
    if (activeWorkspace?.organizationId) {
      return organizations.find((o) => o.id === activeWorkspace.organizationId);
    }
    if (activeOrganizationId) {
      return organizations.find((o) => o.id === activeOrganizationId);
    }
    return organizations.length > 0 ? organizations[0] : undefined;
  }, [activeWorkspace, activeOrganizationId, organizations]);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);

  if (
    organizations.length === 0 ||
    workspaces.length === 0 ||
    !activeWorkspace ||
    !activeOrganization
  ) {
    return null;
  }

  // Фильтруем workspace только текущей организации
  const currentOrgWorkspaces = workspaces.filter(
    (w) => w.organizationId === activeOrganization.id,
  );

  const handleWorkspaceChange = (workspace: (typeof workspaces)[number]) => {
    if (!workspace.organizationSlug || !workspace.slug) {
      console.error(
        "Invalid workspace data: missing organizationSlug or slug",
        workspace,
      );
      return;
    }

    if (workspace.organizationId) {
      setActiveWorkspace({
        organizationId: workspace.organizationId,
        workspaceId: workspace.id,
      });
    }

    router.push(
      paths.workspace.root(workspace.organizationSlug, workspace.slug),
    );

    // Инвалидируем кэш для обновления данных
    queryClient.invalidateQueries(trpc.workspace.list.pathFilter());
    queryClient.invalidateQueries(trpc.organization.list.pathFilter());
  };

  const handleOrganizationChange = (
    organization: (typeof organizations)[number],
  ) => {
    // Находим первый воркспейс в этой организации
    const firstWorkspace = workspaces.find(
      (w) => w.organizationId === organization.id,
    );

    if (firstWorkspace?.organizationSlug && firstWorkspace?.slug) {
      setActiveWorkspace({
        organizationId: organization.id,
        workspaceId: firstWorkspace.id,
      });

      // Перенаправляем на первый воркспейс
      router.push(
        paths.workspace.root(
          firstWorkspace.organizationSlug,
          firstWorkspace.slug,
        ),
      );
    } else {
      // Если нет воркспейсов, перенаправляем на страницу списка
      router.push(paths.organization.workspaces(organization.slug));
    }

    // Инвалидируем кэш для обновления данных
    queryClient.invalidateQueries(trpc.workspace.list.pathFilter());
    queryClient.invalidateQueries(trpc.organization.list.pathFilter());
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                  {activeOrganization.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeOrganization.logo}
                      alt={activeOrganization.name}
                      className="size-8 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBuildingCommunity className="size-4" />
                  )}
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeOrganization.name}
                    <span className="text-muted-foreground font-normal">
                      {" / "}
                      {activeWorkspace.name}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <Badge
                      variant={getPlanBadgeVariant(activeOrganization.plan)}
                      className="text-[10px] px-1.5 py-0 font-medium"
                    >
                      {getPlanLabel(activeOrganization.plan)}
                    </Badge>
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="flex flex-col gap-2 p-2">
              <DropdownMenuLabel className="text-muted-foreground px-0 text-xs font-normal">
                Организация · здесь тариф и оплата
              </DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  {activeOrganization.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeOrganization.logo}
                      alt={activeOrganization.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBuildingCommunity className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-sm">
                      {activeOrganization.name}
                    </span>
                    <Badge
                      variant={getPlanBadgeVariant(activeOrganization.plan)}
                      className="text-[10px] shrink-0 px-1.5 py-0"
                    >
                      {getPlanLabel(activeOrganization.plan)}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {activeOrganization.memberCount ?? 1}{" "}
                    {getPluralForm(activeOrganization.memberCount ?? 1, [
                      "участник",
                      "участника",
                      "участников",
                    ])}{" "}
                    · {activeOrganization.workspaceCount ?? 0}{" "}
                    {getPluralForm(activeOrganization.workspaceCount ?? 0, [
                      "пространство",
                      "пространства",
                      "пространств",
                    ])}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    router.push(
                      paths.organization.settings.root(activeOrganization.slug),
                    );
                  }}
                >
                  <IconSettings className="size-4" />
                  <span className="text-sm">Настройки</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 border-primary/20 bg-primary/5 p-2 focus:bg-primary/10"
                  onClick={() => {
                    router.push(
                      paths.organization.settings.billing(
                        activeOrganization.slug,
                      ),
                    );
                  }}
                >
                  <IconCreditCard className="size-4" />
                  <span className="font-medium text-sm">Тариф и оплата</span>
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-2 p-2">
              <DropdownMenuLabel className="text-muted-foreground px-0 text-xs font-normal">
                Рабочее пространство · текущий контекст
              </DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  {activeWorkspace.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeWorkspace.logo}
                      alt={activeWorkspace.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBriefcase className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {activeWorkspace.memberCount ?? 1}{" "}
                    {getPluralForm(activeWorkspace.memberCount ?? 1, [
                      "участник",
                      "участника",
                      "участников",
                    ])}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    if (!activeWorkspace.organizationSlug) return;
                    router.push(
                      paths.workspace.settings.root(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      ),
                    );
                  }}
                >
                  <IconSettings className="size-4" />
                  <span className="text-sm">Настройки</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    if (!activeWorkspace.organizationSlug) return;
                    router.push(
                      paths.workspace.settings.members(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      ),
                    );
                  }}
                >
                  <IconUserPlus className="size-4" />
                  <span className="text-sm">Пригласить</span>
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Рабочие пространства
            </DropdownMenuLabel>
            {currentOrgWorkspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceChange(workspace)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {workspace.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={workspace.logo}
                      alt={workspace.name}
                      className="size-6 rounded-md object-cover"
                    />
                  ) : (
                    <IconBriefcase className="size-3.5 shrink-0" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-sm">{workspace.name}</span>
                </div>
                {workspace.id === activeWorkspace.id && (
                  <div className="ml-auto size-2 rounded-full bg-primary" />
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateDialogOpen(true)}
              disabled={
                !activeWorkspace.organizationId ||
                !activeWorkspace.organizationSlug
              }
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IconPlus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Создать рабочее пространство
              </div>
            </DropdownMenuItem>
            {organizations.length >= 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <IconBuildingCommunity className="size-4" />
                    </div>
                    <div className="font-medium">Переключить организацию</div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-80">
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                      Организации
                    </DropdownMenuLabel>
                    {organizations.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        onClick={() => handleOrganizationChange(organization)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border">
                          {organization.logo ? (
                            // biome-ignore lint/performance/noImgElement: external URL from database
                            <img
                              src={organization.logo}
                              alt={organization.name}
                              className="size-6 rounded-md object-cover"
                            />
                          ) : (
                            <IconBuildingCommunity className="size-3.5 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium text-sm">
                            {organization.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {organization.workspaceCount ?? 0}{" "}
                            {getPluralForm(organization.workspaceCount ?? 0, [
                              "пространство",
                              "пространства",
                              "пространств",
                            ])}
                          </span>
                        </div>
                        {organization.id === activeOrganization.id && (
                          <div className="ml-auto size-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      onClick={() => setCreateOrgDialogOpen(true)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <IconPlus className="size-4" />
                      </div>
                      <div className="text-muted-foreground font-medium">
                        Создать организацию
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {activeWorkspace.organizationId && activeWorkspace.organizationSlug && (
        <CreateWorkspaceDialog
          organizationId={activeWorkspace.organizationId}
          organizationSlug={activeWorkspace.organizationSlug}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
      <CreateOrganizationDialog
        open={createOrgDialogOpen}
        onOpenChange={setCreateOrgDialogOpen}
      />
    </SidebarMenu>
  );
}
