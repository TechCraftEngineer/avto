"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";

export function UserInfo() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(paths.auth.signin);
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Не удалось выйти из аккаунта");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 m-5 flex flex-col gap-2">
      <div className="flex items-center gap-1 text-xs text-neutral-600">
        Вы вошли как{" "}
        <b className="text-neutral-800 dark:text-neutral-200">
          {session.user.email}
        </b>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="h-8 w-fit rounded-lg px-3 text-xs shadow-sm"
      >
        {isSigningOut ? (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="min-w-0 truncate">Выход...</span>
          </div>
        ) : (
          <div className="min-w-0 truncate">Войти как другой пользователь</div>
        )}
      </Button>
    </div>
  );
}
