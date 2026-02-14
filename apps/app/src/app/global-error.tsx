"use client";

import { Button } from "@qbs-autonaim/ui";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-8">
                <AlertTriangle className="h-24 w-24 text-destructive" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-6xl font-bold tracking-tight">Ошибка</h1>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Произошла ошибка
                </h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Произошла непредвиденная ошибка. Мы уже работаем над её
                устранением. Попробуйте обновить страницу или вернуться на
                главную.
              </p>

              {/* Error details (only in development) */}
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={reset}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Попробовать снова
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
                Если проблема повторяется, свяжитесь с поддержкой
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
