"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isForbiddenError } from "~/lib/errors";

export default function OrganizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Organization error:", error);
  }, [error]);

  // Проверяем, является ли это ошибкой доступа
  const isForbidden = isForbiddenError(error);

  if (isForbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-8 shadow-lg shadow-destructive/5">
              <ShieldX className="h-24 w-24 text-destructive" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold tracking-tight">403</h1>
              <h2 className="text-2xl font-semibold tracking-tight">
                Доступ запрещён
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              У вас нет прав для просмотра этой организации. Если вы считаете,
              что это ошибка, обратитесь к администратору организации.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                На главную
              </Link>
            </Button>
          </div>

          {/* Additional help */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Нужна помощь? Свяжитесь с администратором организации для
              получения доступа
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Для других ошибок показываем стандартный error UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-8">
            <ShieldX className="h-24 w-24 text-destructive" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Произошла ошибка
            </h1>
            <h2 className="text-xl font-semibold tracking-tight">
              Не удалось загрузить организацию
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Произошла непредвиденная ошибка при загрузке организации. Попробуйте
            обновить страницу или вернуться назад.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
              <p className="text-sm font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground font-mono">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Попробовать снова
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Если проблема повторяется, свяжитесь с поддержкой
          </p>
        </div>
      </div>
    </div>
  );
}
