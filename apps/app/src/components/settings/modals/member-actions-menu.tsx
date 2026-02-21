"use client";

import { paths } from "@qbs-autonaim/config";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@qbs-autonaim/ui/components/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@qbs-autonaim/ui/components/dropdown-menu";
import {
  IconCopy,
  IconMail,
  IconTrash,
  IconUserMinus,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
  inviteToken?: string;
}

type DialogType = "remove" | "leave" | "cancel-invite" | null;

export function useMemberActionsMenu({
  member,
  workspaceId,
  canManage,
  isCurrentUser,
}: {
  member: Member;
  workspaceId: string;
  canManage: boolean;
  isCurrentUser: boolean;
}) {
  const [dialogType, setDialogType] = useState<DialogType>(null);

  return {
    MemberActionsMenu: ({ children }: { children: ReactNode }) => (
      <>
        <MemberActionsDropdown
          member={member}
          workspaceId={workspaceId}
          canManage={canManage}
          isCurrentUser={isCurrentUser}
          onAction={setDialogType}
        >
          {children}
        </MemberActionsDropdown>
        <RemoveMemberDialog
          open={dialogType === "remove"}
          onOpenChange={(open) => setDialogType(open ? "remove" : null)}
          member={member}
          workspaceId={workspaceId}
        />
        <LeaveWorkspaceDialog
          open={dialogType === "leave"}
          onOpenChange={(open) => setDialogType(open ? "leave" : null)}
          workspaceId={workspaceId}
          userId={member.id}
        />
        <CancelInviteDialog
          open={dialogType === "cancel-invite"}
          onOpenChange={(open) => setDialogType(open ? "cancel-invite" : null)}
          member={member}
          workspaceId={workspaceId}
        />
      </>
    ),
  };
}

function MemberActionsDropdown({
  member,
  workspaceId,
  canManage,
  isCurrentUser,
  onAction,
  children,
}: {
  member: Member;
  workspaceId: string;
  canManage: boolean;
  isCurrentUser: boolean;
  onAction: (action: DialogType) => void;
  children: ReactNode;
}) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const resendInvite = useMutation(
    trpc.workspace.invites.resend.mutationOptions({
      onSuccess: () => {
        toast.success("Приглашение отправлено повторно");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось отправить приглашение");
      },
    }),
  );

  const handleResendInvite = () => {
    resendInvite.mutate({
      workspaceId,
      email: member.email,
      role: member.role,
    });
  };

  const handleCopyInviteLink = async () => {
    try {
      if (!member.inviteToken) {
        toast.error("Токен приглашения не найден");
        return;
      }
      const inviteUrl = `${window.location.origin}${paths.invitations.accept(member.inviteToken)}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Ссылка скопирована в буфер обмена");
      setOpen(false);
    } catch (err) {
      console.error(
        `Failed to copy invite link for memberId=${member.id}:`,
        err,
      );
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      toast.error(`Не удалось скопировать ссылку: ${errorMessage}`);
    }
  };

  const handleRemove = () => {
    setOpen(false);
    onAction("remove");
  };

  const handleLeave = () => {
    setOpen(false);
    onAction("leave");
  };

  const handleCancelInvite = () => {
    setOpen(false);
    onAction("cancel-invite");
  };

  const isInvited = member.status === "invited";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isInvited && canManage && (
          <>
            <DropdownMenuItem
              onClick={handleResendInvite}
              disabled={resendInvite.isPending}
            >
              <IconMail className="mr-2 h-4 w-4" />
              Отправить повторно
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyInviteLink}>
              <IconCopy className="mr-2 h-4 w-4" />
              Скопировать ссылку
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCancelInvite}>
              <IconX className="mr-2 h-4 w-4" />
              Отменить приглашение
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isCurrentUser && !isInvited && (
          <DropdownMenuItem onClick={handleLeave}>
            <IconUserMinus className="mr-2 h-4 w-4" />
            Покинуть workspace
          </DropdownMenuItem>
        )}

        {canManage && !isCurrentUser && (
          <DropdownMenuItem
            onClick={handleRemove}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Удалить участника
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const removeUser = useMutation(
    trpc.workspace.members.remove.mutationOptions({
      onSuccess: () => {
        toast.success(`${member.name} удален из workspace`);
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.members.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось удалить участника");
      },
    }),
  );

  const handleRemove = () => {
    removeUser.mutate({
      workspaceId,
      userId: member.id,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить участника?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить{" "}
            <span className="font-medium">{member.name}</span> из workspace? Это
            действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeUser.isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={removeUser.isPending}
            className="bg-destructive !text-white hover:bg-destructive/90"
          >
            {removeUser.isPending ? "Удаление..." : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LeaveWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  userId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const leaveWorkspace = useMutation(
    trpc.workspace.members.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Вы покинули workspace");
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.members.pathFilter());
        router.push("/");
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось покинуть workspace";
        toast.error(message);
      },
    }),
  );

  const handleLeave = () => {
    leaveWorkspace.mutate({
      workspaceId,
      userId,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Покинуть workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите покинуть этот workspace? Вы потеряете доступ
            ко всем проектам и данным. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={leaveWorkspace.isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={leaveWorkspace.isPending}
            className="bg-destructive !text-white hover:bg-destructive/90"
          >
            {leaveWorkspace.isPending ? "Выход..." : "Покинуть"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelInviteDialog({
  open,
  onOpenChange,
  member,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cancelInvite = useMutation(
    trpc.workspace.invites.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Приглашение отменено");
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.members.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось отменить приглашение");
      },
    }),
  );

  const handleCancel = () => {
    cancelInvite.mutate({
      workspaceId,
      email: member.email,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отменить приглашение?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите отменить приглашение для{" "}
            <span className="font-medium">{member.email}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelInvite.isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={cancelInvite.isPending}
            className="bg-destructive !text-white hover:bg-destructive/90"
          >
            {cancelInvite.isPending ? "Отмена..." : "Отменить приглашение"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
