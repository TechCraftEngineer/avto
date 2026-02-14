"use client";

import type { OrganizationRole, Workspace } from "@qbs-autonaim/db";
import { Button } from "@qbs-autonaim/ui";
import { Input } from "@qbs-autonaim/ui";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { CreateWorkspaceDialog } from "../create-workspace-dialog";
import { WorkspaceCard } from "../workspace-card";

interface WorkspaceListClientProps {
  organizationId: string;
  organizationSlug: string;
  initialWorkspaces: Workspace[];
  userRole: OrganizationRole | null;
}

export function WorkspaceListClient({
  organizationId,
  organizationSlug,
  initialWorkspaces,
  userRole,
}: WorkspaceListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Фильтрация рабочих пространств по поисковому запросу
  const filteredWorkspaces = initialWorkspaces.filter((workspace) => {
    const query = searchQuery.toLowerCase();
    return (
      workspace.name.toLowerCase().includes(query) ||
      workspace.slug.toLowerCase().includes(query) ||
      workspace.description?.toLowerCase().includes(query)
    );
  });

  const canCreateWorkspace = userRole === "owner" || userRole === "admin";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Рабочие пространства</h1>
          <p className="text-muted-foreground mt-2">
            Управляйте рабочими пространствами вашей организации
          </p>
        </div>
        {canCreateWorkspace && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать рабочее пространство
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, slug или описанию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground mb-4 text-center">
            {searchQuery
              ? "Рабочие пространства не найдены"
              : "У вас пока нет рабочих пространств"}
          </p>
          {canCreateWorkspace && !searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первое рабочее пространство
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              organizationSlug={organizationSlug}
            />
          ))}
        </div>
      )}

      <CreateWorkspaceDialog
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
