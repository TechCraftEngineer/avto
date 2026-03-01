"use client";

import { paths } from "@qbs-autonaim/config";
import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getAvatarUrl } from "~/lib/avatar";
import { useORPC } from "~/orpc/react";
import type { WorkspaceInvite } from "~/types/api";

type Invite = WorkspaceInvite;

export function InvitationsClient({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [processingTokens, setProcessingTokens] = useState<Set<string>>(
    new Set(),
  );

  const orpc = useORPC();
  const acceptMutation = useMutation(
    orpc.workspace.invites.accept.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Вы присоединились к ${data.workspace.name}`);
        router.push(
          paths.workspace.root(
            data.workspace.organization?.slug ?? "",
            data.workspace.slug,
          ),
        );
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось принять приглашение");
      },
    }),
  );

  const handleAccept = async (token: string) => {
    setProcessingTokens((prev) => new Set(prev).add(token));
    try {
      await acceptMutation.mutateAsync({ token });
    } catch (_error) {
      setProcessingTokens((prev) => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  const handleSkip = () => {
    // Редирект на onboarding для создания собственного workspace
    router.push(paths.onboarding.root);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Владелец";
      case "admin":
        return "Администратор";
      default:
        return "Участник";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">У вас есть приглашения</h1>
          <p className="text-muted-foreground">
            Вас пригласили присоединиться к рабочему пространству
          </p>
        </div>

        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={getAvatarUrl(
                        invite.workspace.logo,
                        invite.workspace.name,
                      )}
                      alt={invite.workspace.name}
                    />
                    <AvatarFallback>
                      {getInitials(invite.workspace.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle>{invite.workspace.name}</CardTitle>
                    <CardDescription>
                      Роль:{" "}
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Срок действия приглашения истекает{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => handleAccept(invite.token)}
                  disabled={processingTokens.has(invite.token)}
                  className="flex-1"
                >
                  {processingTokens.has(invite.token)
                    ? "Принимаем…"
                    : "Принять"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleSkip}>
            Создать своё пространство
          </Button>
        </div>
      </div>
    </div>
  );
}
