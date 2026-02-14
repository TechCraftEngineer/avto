"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Button } from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface InviteAcceptClientProps {
  invite: RouterOutputs["workspace"]["invites"]["list"][number];
  token: string;
}

export function InviteAcceptClient({ invite, token }: InviteAcceptClientProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const acceptInvite = useMutation(
    trpc.workspace.invites.accept.mutationOptions({
      onSuccess: () => {
        toast.success(`Вы присоединились к ${invite.workspace.name}`);
        router.push(
          `/orgs/${invite.workspace.organization?.slug}/workspaces/${invite.workspace.slug}`,
        );
        router.refresh();
      },
      onError: (err) => {
        const errorMessage = err.message || "Не удалось принять приглашение";
        toast.error(errorMessage);

        // Если ошибка связана с доступом, перезагружаем страницу
        if (
          err.message?.includes("другого пользователя") ||
          err.message?.includes("участником")
        ) {
          setTimeout(() => {
            router.refresh();
          }, 2000);
        }
      },
    }),
  );

  const handleAccept = () => {
    acceptInvite.mutate({ token });
  };

  const handleDecline = () => {
    router.push("/");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Владелец";
      case "admin":
        return "Администратор";
      case "member":
        return "Участник";
      default:
        return role;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center space-y-2">
          {invite.workspace.logo && (
            <div className="flex justify-center mb-4">
              {/* biome-ignore lint/performance/noImgElement: external URL from database */}
              <img
                src={invite.workspace.logo}
                alt={invite.workspace.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">
            Приглашение в рабочее пространство
          </h1>
          <p className="text-muted-foreground">
            Вы приглашены присоединиться к
          </p>
          <p className="text-xl font-semibold">{invite.workspace.name}</p>
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Роль:</span>
            <span className="font-medium">{getRoleLabel(invite.role)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Действительно до:</span>
            <span className="font-medium">
              {new Date(invite.expiresAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={acceptInvite.isPending}
            className="w-full"
          >
            {acceptInvite.isPending ? "Присоединение…" : "Принять приглашение"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full"
            disabled={acceptInvite.isPending}
          >
            Отклонить
          </Button>
        </div>
      </div>
    </div>
  );
}
