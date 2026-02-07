"use client";

import { APP_CONFIG } from "@qbs-autonaim/config";
import { GalleryVerticalEnd } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "~/auth/client";

export default function SignOutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningOut, setIsSigningOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignOut = async () => {
      try {
        const redirectPath = searchParams.get("redirect") ?? "/";

        await signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push(redirectPath);
            },
            onError: (ctx) => {
              setError(
                ctx.error.message ?? "Произошла ошибка при выходе из системы",
              );
              setIsSigningOut(false);
            },
          },
        });
      } catch (_err) {
        setError("Произошла ошибка при выходе из системы");
        setIsSigningOut(false);
      }
    };

    performSignOut();
  }, [router, searchParams]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd
              className="size-4"
              aria-label="Логотип компании"
            />
          </div>
          {APP_CONFIG.name}
        </a>

        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
          {isSigningOut ? (
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground text-sm">Выход из системы…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col gap-4">
              <p className="text-destructive text-sm">{error}</p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              >
                На главную
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
