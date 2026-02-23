"use client";

import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui/components/table";
import { IconDots, IconSearch, IconUserPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { InviteMemberDialog } from "~/components/organization/components";
import { getAvatarUrl } from "~/lib/avatar";
import { useORPC } from "~/orpc/react";

type MemberRole = "owner" | "admin" | "member";

interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: MemberRole;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface OrganizationInvite {
  id: string;
  organizationId: string;
  invitedEmail: string | null;
  role: MemberRole;
  expiresAt: Date;
  createdAt: Date;
}

type MemberOrInvite =
  | { type: "member"; data: OrganizationMember }
  | { type: "invite"; data: OrganizationInvite };

function MembersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-full max-w-sm ml-auto" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader, order never changes
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-10 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Stats Skeleton */}
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

export function OrganizationMembersClient({
  organizationId,
  currentUserId,
  currentUserRole,
}: {
  organizationId: string;
  currentUserId: string;
  currentUserRole?: MemberRole;
}) {
  const orpc = useORPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all");

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin";
  const canManageMembers = isOwner || isAdmin;

  // Получение участников
  const { data: members, isLoading: membersLoading } = useQuery(
    orpc.organization.listMembers.queryOptions({
      input: { organizationId },
    }),
  );

  // Получение приглашений (только для админов)
  const { data: invites, isLoading: invitesLoading } = useQuery({
    ...orpc.organization.listInvites.queryOptions({
      input: { organizationId },
    }),
    enabled: canManageMembers,
  });

  const isLoading = membersLoading || (canManageMembers && invitesLoading);

  // Объединение участников и приглашений
  const allMembersAndInvites = useMemo((): MemberOrInvite[] => {
    const membersList: MemberOrInvite[] =
      members?.map((m) => ({ type: "member" as const, data: m })) || [];
    const now = new Date();
    const personalInvitesList: MemberOrInvite[] =
      invites
        ?.filter((i) => new Date(i.expiresAt) > now && i.invitedEmail !== null)
        .map((i) => ({ type: "invite" as const, data: i })) || [];
    return [...membersList, ...personalInvitesList];
  }, [members, invites]);

  // Фильтрация участников и приглашений
  const filteredItems = useMemo(() => {
    return allMembersAndInvites.filter((item) => {
      if (item.type === "member") {
        const member = item.data;
        const matchesSearch =
          member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || member.role === roleFilter;
        return matchesSearch && matchesRole;
      } else {
        const invite = item.data;
        const matchesSearch =
          !searchQuery ||
          (invite.invitedEmail
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ??
            false);
        const matchesRole = roleFilter === "all" || invite.role === roleFilter;
        return matchesSearch && matchesRole;
      }
    });
  }, [allMembersAndInvites, searchQuery, roleFilter]);

  // Подсчет общего количества участников и приглашений
  const totalStats = useMemo(() => {
    const membersCount = allMembersAndInvites.filter(
      (item) => item.type === "member",
    ).length;
    const invitesCount = allMembersAndInvites.filter(
      (item) => item.type === "invite",
    ).length;
    return { membersCount, invitesCount };
  }, [allMembersAndInvites]);

  if (isLoading) {
    return <MembersLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Участники"
        description="Управляйте участниками организации"
      >
        {canManageMembers && (
          <InviteMemberDialog organizationId={organizationId} />
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as MemberRole | "all")}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="owner">Владелец</SelectItem>
            <SelectItem value="admin">Администратор</SelectItem>
            <SelectItem value="member">Участник</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 sm:max-w-sm sm:ml-auto">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Имя</TableHead>
              <TableHead className="min-w-[120px]">Роль</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Участники не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) =>
                item.type === "member" ? (
                  <MemberRow
                    key={item.data.userId}
                    member={item.data}
                    organizationId={organizationId}
                    currentUserId={currentUserId}
                    canManageMembers={canManageMembers}
                    isOwner={isOwner}
                  />
                ) : (
                  <InviteRow
                    key={item.data.id}
                    invite={item.data}
                    organizationId={organizationId}
                    canManageMembers={canManageMembers}
                  />
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Показано {filteredItems.length} из {allMembersAndInvites.length} (
        {totalStats.membersCount} участников, {totalStats.invitesCount}{" "}
        приглашений)
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  organizationId,
  canManageMembers,
}: {
  invite: OrganizationInvite;
  organizationId: string;
  canManageMembers: boolean;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteInviteMutation = useMutation(
    orpc.organization.deleteInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Приглашение отменено");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listInvites.queryKey({
            input: { organizationId },
          }),
        });
        setShowDeleteDialog(false);
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось отменить приглашение");
      },
    }),
  );

  const handleDelete = () => {
    deleteInviteMutation.mutate({
      organizationId,
      inviteId: invite.id,
    });
  };

  return (
    <>
      <TableRow className="bg-muted/30">
        <TableCell>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <IconUserPlus className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                <span className="truncate">
                  {invite.invitedEmail ?? "Публичное приглашение"}
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded whitespace-nowrap">
                  Приглашён
                </span>
              </div>
              <div className="text-sm text-muted-foreground truncate">
                Истекает:{" "}
                {new Date(invite.expiresAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Select value={invite.role} disabled>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Владелец</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
              <SelectItem value="member">Участник</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          {canManageMembers && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowDeleteDialog(true)}
            >
              <IconDots className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-invite-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowDeleteDialog(false);
            }
          }}
        >
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3
              id="delete-invite-dialog-title"
              className="text-lg font-semibold mb-2"
            >
              Отменить приглашение?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Вы уверены, что хотите отменить это приглашение? Ссылка станет
              недействительной.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteInviteMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteInviteMutation.isPending}
              >
                {deleteInviteMutation.isPending ? "Отмена…" : "Отменить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MemberRow({
  member,
  organizationId,
  currentUserId,
  canManageMembers,
  isOwner,
}: {
  member: OrganizationMember;
  organizationId: string;
  currentUserId: string;
  canManageMembers: boolean;
  isOwner: boolean;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const isCurrentUser = member.userId === currentUserId;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const initials = getInitials(member.user.name);
  const avatarUrl = getAvatarUrl(member.user.image, member.user.name);

  const updateRole = useMutation(
    orpc.organization.updateMemberRole.mutationOptions({
      onSuccess: () => {
        toast.success("Роль обновлена");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.queryKey({
            input: { organizationId },
          }),
        });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось обновить роль");
      },
    }),
  );

  const removeMemberMutation = useMutation(
    orpc.organization.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Участник удалён");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.queryKey({
            input: { organizationId },
          }),
        });
        setShowDeleteDialog(false);
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось удалить участника");
      },
    }),
  );

  const handleRoleChange = (newRole: MemberRole) => {
    updateRole.mutate({
      organizationId,
      userId: member.userId,
      role: newRole,
    });
  };

  const handleDelete = () => {
    removeMemberMutation.mutate({
      organizationId,
      userId: member.userId,
    });
  };

  const canChangeRole =
    !isCurrentUser &&
    (isOwner || (canManageMembers && member.role !== "owner"));

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={avatarUrl} alt={member.user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">{member.user.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {member.user.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={!canChangeRole || updateRole.isPending}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Владелец</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
              <SelectItem value="member">Участник</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          {(canManageMembers || isCurrentUser) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Действия с участником"
            >
              <IconDots className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowDeleteDialog(false);
            }
          }}
        >
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 id="delete-dialog-title" className="text-lg font-semibold mb-2">
              Удалить участника?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Вы уверены, что хотите удалить {member.user.name} из организации?
              Это действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={removeMemberMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? "Удаление…" : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
