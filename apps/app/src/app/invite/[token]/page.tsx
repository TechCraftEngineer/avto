import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";
import { InviteAcceptClient } from "./invite-accept-client";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  // Случай 1: Неавторизованный пользователь
  if (!session?.user) {
    redirect(
      `${paths.auth.signin}?redirect=${paths.invitations.accept(token)}`,
    );
  }

  try {
    const caller = await api();
    const invite = await caller.workspace.invites.getByToken({ token });

    if (!invite) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Приглашение не найдено</h1>
            <p className="text-muted-foreground">
              Ссылка приглашения недействительна или истекла
            </p>
            <Button asChild className="w-full">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Проверяем срок действия
    if (new Date(invite.expiresAt) < new Date()) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Приглашение истекло</h1>
            <p className="text-muted-foreground">
              Срок действия этой ссылки истек. Попросите новую ссылку у
              администратора рабочего пространства.
            </p>
            <Button asChild className="w-full">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Случай 2: Пользователь уже является участником
    const userWorkspaces = await caller.workspace.list();
    const isAlreadyMember = userWorkspaces.some(
      (uw) => uw.workspace.id === invite.workspaceId,
    );

    if (isAlreadyMember) {
      redirect(
        paths.workspace.root(
          invite.workspace.organization?.slug ?? "",
          invite.workspace.slug,
        ),
      );
    }

    // Случай 3: Приглашение для конкретного пользователя (по ID)
    if (invite.invitedUserId && invite.invitedUserId !== session.user.id) {
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
              <h1 className="text-2xl font-bold">Неверный аккаунт</h1>
              <p className="text-muted-foreground">
                Это приглашение предназначено для другого пользователя.
              </p>
              {invite.invitedEmail && (
                <p className="text-sm text-muted-foreground">
                  Приглашение отправлено на:{" "}
                  <strong>{invite.invitedEmail}</strong>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signout?redirect=/auth/signin">
                  Войти другим аккаунтом
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">На главную</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Случай 4: Приглашение для конкретного email
    if (invite.invitedEmail) {
      const sessionEmail = session.user.email?.toLowerCase();
      const invitedEmail = invite.invitedEmail.toLowerCase();

      if (!sessionEmail || sessionEmail !== invitedEmail) {
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
                <h1 className="text-2xl font-bold">Неверный email</h1>
                <p className="text-muted-foreground">
                  Это приглашение предназначено для другого email адреса.
                </p>
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Приглашение для:
                    </span>
                    <span className="font-medium">{invite.invitedEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ваш email:</span>
                    <span className="font-medium">
                      {sessionEmail || "не указан"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signout?redirect=/auth/signin">
                    Войти другим аккаунтом
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/">На главную</Link>
                </Button>
              </div>
            </div>
          </div>
        );
      }
    }

    // Случай 5: Всё в порядке, показываем форму принятия приглашения
    return <InviteAcceptClient invite={invite} token={token} />;
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Ошибка</h1>
          <p className="text-muted-foreground">
            Не удалось загрузить информацию о приглашении
          </p>
          <Button asChild className="w-full">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    );
  }
}
