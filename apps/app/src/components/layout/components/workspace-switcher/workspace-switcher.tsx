"use client";

import { paths } from "@qbs-autonaim/config";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconCreditCard,
  IconPlus,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CreateOrganizationDialog } from "~/components/organization";
import { CreateWorkspaceDialog } from "~/components/workspace";
import { useWorkspaces } from "~/contexts/workspace-context";
import { getPluralForm } from "~/lib/pluralization";
import { useTRPC } from "~/trpc/react";

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
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
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
                <span className="text-muted-foreground">/</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeWorkspace.plan ?? "Бесплатный"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg border">
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
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-sm">
                    {activeOrganization.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {activeOrganization.plan ?? "Бесплатный"} ·{" "}
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
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    router.push(
                      paths.organization.settings.usage(
                        activeOrganization.slug,
                      ),
                    );
                  }}
                >
                  <IconCreditCard className="size-4" />
                  <span className="text-sm">Потребление</span>
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg border">
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
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-sm">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
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
